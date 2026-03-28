// src/core/auth/token.ts
const AK = "access_token";
const RK = "refresh_token";

export const getAccess = () => localStorage.getItem(AK);
export const getRefresh = () => localStorage.getItem(RK);
export const setTokens = (a: string, r: string) => {
  localStorage.setItem(AK, a);
  localStorage.setItem(RK, r);
};
export const clearTokens = () => {
  localStorage.removeItem(AK);
  localStorage.removeItem(RK);
};

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

export function isExpired(token: string, buffer = 30): boolean {
  const p = parseToken(token);
  return !p || p.exp * 1000 < Date.now() + buffer * 1000;
}

export const AUTH_BASE =
  import.meta.env.VITE_AUTH_BASE_URL ?? "https://api.vocabili.top/v2";

let refreshing: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  const rt = getRefresh();
  if (!rt) return null;
  try {
    const res = await fetch(`${AUTH_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const d = await res.json();
    setTokens(d.access_token, rt);
    return d.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

export async function validToken(): Promise<string | null> {
  const t = getAccess();
  if (!t) return null;
  if (!isExpired(t)) return t;
  if (!refreshing)
    refreshing = refreshAccessToken().finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function authHeaders(): Promise<Record<string, string>> {
  const t = await validToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
