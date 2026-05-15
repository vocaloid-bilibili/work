// src/shell/AuthProvider.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
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

// 调试模式配置
const DEBUG_MODE = import.meta.env.VITE_DEBUG_AUTO_LOGIN === "true";
const DEBUG_USERNAME = import.meta.env.VITE_DEBUG_USERNAME ?? "debug";
const DEBUG_ROLE = import.meta.env.VITE_DEBUG_ROLE ?? "admin";
const DEBUG_ROLE_ID = Number(import.meta.env.VITE_DEBUG_ROLE_ID) || 1;

const AuthCtx = createContext<Ctx | null>(null);

function getDebugUser(): CachedUser {
  return {
    id: DEBUG_ROLE_ID,
    username: DEBUG_USERNAME,
    nickname: DEBUG_USERNAME,
    role: DEBUG_ROLE,
    avatar_url: null,
  };
}

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

function getInitialState(): State {
  // 调试模式：直接使用配置的用户信息
  if (DEBUG_MODE) {
    return applyUser(getDebugUser());
  }

  const cached = getCachedUser();
  if (cached && checkAccess(cached.role)) {
    return applyUser(cached);
  }
  return { ...EMPTY, loading: true };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(getInitialState);
  const didInit = useRef(false);

  const verifySession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${AUTH_BASE}/auth/me`, {
        credentials: "include",
      });
      if (!res.ok) {
        const refreshRes = await fetch(`${AUTH_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!refreshRes.ok) {
          clearCachedUser();
          setState({ ...EMPTY });
          return false;
        }
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

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    // 调试模式：跳过后端验证
    if (DEBUG_MODE) {
      return;
    }

    const cached = getCachedUser();
    if (cached && checkAccess(cached.role)) {
      return;
    }

    verifySession().finally(() => {
      setState((prev) => (prev.loading ? { ...prev, loading: false } : prev));
    });
  }, [verifySession]);

  // 监听 401 事件
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
      // 调试模式：直接设置调试用户
      if (DEBUG_MODE) {
        const debugUser = getDebugUser();
        setCachedUser(debugUser);
        setState(applyUser(debugUser));
        return;
      }

      const res = await fetch(`${AUTH_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
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
    // 调试模式：只清除本地缓存
    if (DEBUG_MODE) {
      clearCachedUser();
      setState(applyUser(getDebugUser()));
      return;
    }

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
