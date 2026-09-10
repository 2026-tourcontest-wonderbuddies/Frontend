import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AUTH_STORAGE_KEY, ApiError } from "../api/client";
import * as authApi from "../api/auth";
import type { AuthSession, User } from "../api/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function storeSession(session: AuthSession | null) {
  if (session) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredSession()?.user ?? null);

  useEffect(() => {
    // Keep multiple tabs roughly in sync.
    function onStorage(e: StorageEvent) {
      if (e.key === AUTH_STORAGE_KEY) {
        setUser(readStoredSession()?.user ?? null);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function loginWithGoogle(accessToken: string) {
    const session = await authApi.loginWithGoogle(accessToken);
    storeSession(session);
    setUser(session.user);
  }

  /** 서버에 로그아웃 엔드포인트가 없다(명세에 미포함). 로컬 세션만 지운다. */
  function logout() {
    storeSession(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: Boolean(user), loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function authErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const body = err.body as { detail?: string; field_errors?: Record<string, string[]> } | null;
    if (body?.detail) return body.detail;
    const firstFieldError = body?.field_errors && Object.values(body.field_errors)[0]?.[0];
    if (firstFieldError) return firstFieldError;
  }
  return fallback;
}
