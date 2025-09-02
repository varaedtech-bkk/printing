module.exports = {
  apps: [
    {
      name: "src",
      script: "dist/index.js",
      cwd: "./",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/src-error.log",
      out_file: "./logs/src-out.log",
      combine_logs: true,
    },
  ],
};
