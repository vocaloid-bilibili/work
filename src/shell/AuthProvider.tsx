// src/shell/AuthProvider.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  getCachedUser,
  setCachedUser,
  clearCachedUser,
  AUTH_BASE,
  type CachedUser,
} from "@/core/auth/token";
import { hasAccess as checkAccess } from "@/core/auth/roles";
import { authExpiredEvent } from "@/core/api/mainClient";

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

function applyUser(user: CachedUser | null): State {
  if (!user || !checkAccess(user.role)) {
    return { ...EMPTY };
  }
  return {
    role: user.role,
    avatarUrl: user.avatar_url,
    nickname: user.nickname,
    username: user.username,
    loading: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ ...EMPTY, loading: true });

  // 从缓存或 /auth/me 恢复登录态
  const verifySession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${AUTH_BASE}/auth/me`, {
        credentials: "include",
      });
      if (!res.ok) {
        // 尝试刷新
        const refreshRes = await fetch(`${AUTH_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!refreshRes.ok) {
          clearCachedUser();
          setState({ ...EMPTY });
          return false;
        }
        // 刷新成功后重新获取
        const retryRes = await fetch(`${AUTH_BASE}/auth/me`, {
          credentials: "include",
        });
        if (!retryRes.ok) {
          clearCachedUser();
          setState({ ...EMPTY });
          return false;
        }
        const retryData = await retryRes.json();
        const user = retryData.user as CachedUser;
        setCachedUser(user);
        setState(applyUser(user));
        return true;
      }
      const data = await res.json();
      const user = data.user as CachedUser;
      setCachedUser(user);
      setState(applyUser(user));
      return true;
    } catch {
      clearCachedUser();
      setState({ ...EMPTY });
      return false;
    }
  }, []);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${AUTH_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        clearCachedUser();
        setState({ ...EMPTY });
        return false;
      }
      const data = await res.json();
      if (data.user) {
        setCachedUser(data.user as CachedUser);
        setState(applyUser(data.user as CachedUser));
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  // 初始化：有缓存先渲染，后台验证
  useEffect(() => {
    const cached = getCachedUser();
    if (cached && checkAccess(cached.role)) {
      // 先用缓存渲染
      setState(applyUser(cached));
      // 后台验证 Cookie 是否还有效
      verifySession();
    } else {
      // 没有缓存，尝试验证（可能主站登录过，Cookie 在）
      verifySession().finally(() => {
        setState((prev) => (prev.loading ? { ...prev, loading: false } : prev));
      });
    }
  }, [verifySession]);

  // 监听 401 事件（mainClient 拦截器触发）
  useEffect(() => {
    const handler = () => {
      clearCachedUser();
      setState({ ...EMPTY });
    };
    authExpiredEvent.addEventListener("expired", handler);
    return () => authExpiredEvent.removeEventListener("expired", handler);
  }, []);

  const login = useCallback(
    async (u: string, p: string, codeId: number, codeAnswer: string) => {
      const res = await fetch(`${AUTH_BASE}/auth/login`, {
        method: "POST",
        credentials: "include", // ← 接收 Set-Cookie
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
      const data = await res.json();
      const user = data.user as CachedUser;
      if (!checkAccess(user.role)) {
        // 登录成功但权限不够
        await fetch(`${AUTH_BASE}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
        throw new Error("需要 worker 或更高权限");
      }
      setCachedUser(user);
      setState(applyUser(user));
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await fetch(`${AUTH_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      clearCachedUser();
      setState({ ...EMPTY });
    }
  }, []);

  const actions = useMemo(
    () => ({ login, logout, refreshAuth }),
    [login, logout, refreshAuth],
  );

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
