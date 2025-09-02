import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import connectPg from "connect-pg-simple";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Database Configuration for Session Store
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "cognitosphere",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(dbConfig);

const app = express();
app.use(express.json());
// Session store
const PostgresSessionStore = connectPg(session);
app.use((session as any)({
  store: new PostgresSessionStore({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || "dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Start the server
(async () => {
  try {
    // Simple SSE broker
    const subscribers: Record<string, Set<any>> = {};
    app.get('/api/events', (req: any, res) => {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).end();
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
      subscribers[userId] = subscribers[userId] || new Set();
      subscribers[userId].add(res);
      req.on('close', () => {
        subscribers[userId].delete(res);
      });
    });
    app.set('sseEmit', (userId: string, data: any) => {
      const set = subscribers[userId];
      if (!set) return;
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      for (const res of set) {
        res.write(payload);
      }
    });

    const server = await registerRoutes(app);

    // Setup Vite in development mode
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app); // Serve static files in production
    }

    // Start the server on port 3000 (or fallback to another port)
    const port = 9001;
    log(`Attempting to start server on port ${port}...`);

    server.listen(port, "0.0.0.0", () => {
      log(`Server is running on http://0.0.0.0:${port}`);
    }).on("error", (err: NodeJS.ErrnoException) => { // Type assertion
      if (err.code === "EADDRINUSE") {
        log(`Port ${port} is already in use. Trying another port...`);
        server.listen(port + 1, "0.0.0.0", () => {
          log(`Server is running on http://0.0.0.0:${port + 1}`);
        });
      } else {
        console.error("Server failed to start:", err);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1); // Exit the process if the server fails to start
  }
})();
