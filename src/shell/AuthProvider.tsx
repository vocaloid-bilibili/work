// src/shell/AuthProvider.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  getAccess,
  getRefresh,
  setTokens,
  clearTokens,
  parseToken,
  isExpired,
  AUTH_BASE,
} from "@/core/auth/token";
import { hasAccess as checkAccess } from "@/core/auth/roles";

interface State {
  role: string;
  avatarUrl: string | null;
  nickname: string | null;
  username: string | null;
  loading: boolean;
}
interface Ctx extends State {
  login: (
    u: string,
    p: string,
    codeId: number,
    codeAnswer: string,
  ) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
}

const EMPTY: State = {
  role: "guest",
  avatarUrl: null,
  nickname: null,
  username: null,
  loading: false,
};
const AuthCtx = createContext<Ctx | null>(null);

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ ...EMPTY, loading: true });

  const apply = useCallback((token: string | null) => {
    if (!token) {
      setState({ ...EMPTY });
      return;
    }
    const p = parseToken(token);
    if (!p || !checkAccess(p.role)) {
      clearTokens();
      setState({ ...EMPTY });
      return;
    }
    setState({
      role: p.role,
      avatarUrl: p.avatar ?? null,
      nickname: p.nickname ?? null,
      username: p.username ?? null,
      loading: false,
    });
  }, []);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    const rt = getRefresh();
    if (!rt) return false;
    try {
      const res = await fetch(`${AUTH_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!res.ok) {
        clearTokens();
        apply(null);
        return false;
      }
      const d = await res.json();
      setTokens(d.access_token, rt);
      apply(d.access_token);
      return true;
    } catch {
      return false;
    }
  }, [apply]);

  useEffect(() => {
    const t = getAccess();
    if (!t) {
      apply(null);
      return;
    }
    if (isExpired(t)) {
      refreshAuth().then((ok) => {
        if (!ok) apply(null);
      });
    } else apply(t);
  }, [apply, refreshAuth]);

  const login = useCallback(
    async (u: string, p: string, codeId: number, codeAnswer: string) => {
      const res = await fetch(`${AUTH_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: u,
          password: p,
          code_id: codeId,
          code_answer: codeAnswer,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: "登录失败" }));
        throw new Error(e.detail || "登录失败");
      }
      const d = await res.json();
      setTokens(d.access_token, d.refresh_token);
      apply(d.access_token);
    },
    [apply],
  );

  const logout = useCallback(() => {
    clearTokens();
    apply(null);
  }, [apply]);

  return (
    <AuthCtx.Provider value={{ ...state, login, logout, refreshAuth }}>
      {children}
    </AuthCtx.Provider>
  );
}
