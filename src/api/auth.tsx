import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { api, setToken } from "./client";
import type { Role, TokenResponse, User } from "./types";

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (body: { email: string; password: string; name: string; phone?: string; role: Role }) => Promise<User>;
  logout: () => void;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // resume a session on load; a stale token simply drops us to signed-out
  useEffect(() => {
    let alive = true;
    api.get<User>("/auth/me")
      .then((u) => { if (alive) setUser(u); })
      .catch(() => { if (alive) setUser(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.post<TokenResponse>("/auth/login", { email, password });
    setToken(r.access_token);
    setUser(r.user);
    return r.user;
  }, []);

  const register = useCallback(async (body: Parameters<AuthValue["register"]>[0]) => {
    const r = await api.post<TokenResponse>("/auth/register", body);
    setToken(r.access_token);
    setUser(r.user);
    return r.user;
  }, []);

  const logout = useCallback(() => { setToken(null); setUser(null); }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}
