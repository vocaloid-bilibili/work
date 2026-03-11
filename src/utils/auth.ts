// src/utils/auth.ts

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export interface TokenPayload {
  role: string;
  avatar?: string | null;
  nickname?: string | null;
  username?: string | null;
  exp: number;
}

export function parseToken(token: string): TokenPayload | null {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, bufferSeconds = 30): boolean {
  const payload = parseToken(token);
  if (!payload) return true;
  return payload.exp * 1000 < Date.now() + bufferSeconds * 1000;
}

// ===== 角色权限 =====

const ROLE_LEVEL: Record<string, number> = {
  user: 0,
  worker: 1,
  sponsor: 2,
  admin: 3,
  superuser: 4,
};

const MIN_ROLE = "worker";

export function hasAccess(role: string): boolean {
  return (ROLE_LEVEL[role] ?? -1) >= (ROLE_LEVEL[MIN_ROLE] ?? 999);
}

export const AUTH_BASE =
  import.meta.env.VITE_AUTH_BASE_URL ?? "https://api.vocabili.top/v2";

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${AUTH_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data = await res.json();
    setTokens(data.access_token, refresh);
    return data.access_token as string;
  } catch {
    clearTokens();
    return null;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const token = getAccessToken();
  if (!token) return null;
  if (!isTokenExpired(token)) return token;

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getValidAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
