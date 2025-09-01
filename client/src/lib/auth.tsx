import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";

export type UserRole = "CUSTOMER" | "VENDOR" | "ADMIN";

type AuthContextValue = {
  userId: string | null;
  role: UserRole;
  setAuth: (next: { userId?: string | null; role?: UserRole }) => void;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("CUSTOMER");

  // Load current session
  React.useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' }).then(async r => {
      if (!r.ok) return;
      const me = await r.json();
      if (me) {
        setUserId(me.id || null);
        setRole((me.role || 'CUSTOMER') as UserRole);
      }
    });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    userId,
    role,
    setAuth: ({ userId: nextId, role: nextRole }) => {
      if (typeof nextId !== "undefined") setUserId(nextId);
      if (typeof nextRole !== "undefined") setRole(nextRole);
    },
    login: async (email: string) => {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email }) });
      if (res.ok) {
        const me = await res.json();
        setUserId(me.id || null);
        setRole((me.role || 'CUSTOMER') as UserRole);
      } else {
        throw new Error(await res.text());
      }
    },
    logout: async () => {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setUserId(null);
      setRole('CUSTOMER');
    }
  }), [userId, role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


