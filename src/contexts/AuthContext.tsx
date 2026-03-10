// src/contexts/AuthContext.tsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  parseToken,
  isTokenExpired,
} from "@/utils/auth";

// 认证 API base（不带 /v2）
const AUTH_BASE =
  import.meta.env.VITE_AUTH_BASE_URL ?? "https://api.vocabili.top/v2";

interface AuthState {
  role: string;
  userId: number | null;
  avatarUrl: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (
    username: string,
    password: string,
    codeId: number,
    codeAnswer: string,
  ) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
  getCaptcha: () => Promise<{ code_id: number; image: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    role: "guest",
    userId: null,
    avatarUrl: null,
    loading: true,
  });

  const applyToken = useCallback((token: string | null) => {
    if (!token) {
      setState({
        role: "guest",
        userId: null,
        avatarUrl: null,
        loading: false,
      });
      return;
    }
    const payload = parseToken(token);
    if (!payload) {
      clearTokens();
      setState({
        role: "guest",
        userId: null,
        avatarUrl: null,
        loading: false,
      });
      return;
    }
    setState({
      role: payload.role,
      userId: payload.sub,
      avatarUrl: payload.avatar_url ?? null,
      loading: false,
    });
  }, []);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    const refresh = getRefreshToken();
    if (!refresh) return false;
    try {
      const res = await fetch(`${AUTH_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) {
        clearTokens();
        applyToken(null);
        return false;
      }
      const data = await res.json();
      setTokens(data.access_token, refresh);
      applyToken(data.access_token);
      return true;
    } catch {
      return false;
    }
  }, [applyToken]);

  // 初始化：检查现有 token
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      applyToken(null);
      return;
    }
    if (isTokenExpired(token)) {
      refreshAuth().then((ok) => {
        if (!ok) applyToken(null);
      });
    } else {
      applyToken(token);
    }
  }, [applyToken, refreshAuth]);

  const getCaptcha = async () => {
    const res = await fetch(`${AUTH_BASE}/auth/captcha`);
    if (!res.ok) throw new Error("获取验证码失败");
    return res.json();
  };

  const login = async (
    username: string,
    password: string,
    codeId: number,
    codeAnswer: string,
  ) => {
    const res = await fetch(`${AUTH_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        code_id: codeId,
        code_answer: codeAnswer,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "登录失败" }));
      throw new Error(err.detail || err.message || "登录失败");
    }
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    applyToken(data.access_token);
  };

  const logout = () => {
    clearTokens();
    applyToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ ...state, login, logout, refreshAuth, getCaptcha }}
    >
      {children}
    </AuthContext.Provider>
  );
}
