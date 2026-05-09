// src/core/auth/token.ts

const USER_INFO_KEY = "vbs_collab_user";

export interface CachedUser {
  id: number;
  username: string;
  nickname: string;
  role: string;
  avatar_url: string | null;
}

export function getCachedUser(): CachedUser | null {
  try {
    const raw = localStorage.getItem(USER_INFO_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedUser;
  } catch {
    return null;
  }
}

export function setCachedUser(user: CachedUser): void {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
}

export function clearCachedUser(): void {
  localStorage.removeItem(USER_INFO_KEY);
}

export function isLoggedIn(): boolean {
  return getCachedUser() !== null;
}

export const AUTH_BASE =
  import.meta.env.VITE_AUTH_BASE_URL ?? "https://api.vocabili.top/v2";
