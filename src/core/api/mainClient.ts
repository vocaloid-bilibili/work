// src/core/api/mainClient.ts
import axios, { type InternalAxiosRequestConfig } from "axios";
import { clearCachedUser, AUTH_BASE } from "../auth/token";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

export const authExpiredEvent = new EventTarget();

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const IS_DEBUG_AUTO_LOGIN =
  import.meta.env.VITE_DEBUG_AUTO_LOGIN === "true";
export const DEBUG_USERNAME = import.meta.env.VITE_DEBUG_USERNAME || "";

export function getDebugHeaders(): Record<string, string> {
  if (!IS_DEBUG_AUTO_LOGIN) return {};
  return { "X-Debug-Auto-Login": "true" };
}


const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120_000,
  withCredentials: true,
});

let _refreshPromise: Promise<boolean> | null = null;

http.interceptors.request.use(
  (config) => {
    const debugHeaders = getDebugHeaders();
    if (Object.keys(debugHeaders).length > 0)
      Object.assign(config.headers, debugHeaders);
    return config;
  },
  (error) => Promise.reject(error),
);


http.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config as InternalAxiosRequestConfig | undefined;

    if (err.response?.status === 401 && orig && !orig._retry) {
      if (orig.url?.includes("/auth/refresh")) {
        clearCachedUser();
        authExpiredEvent.dispatchEvent(new Event("expired"));
        return Promise.reject(err);
      }

      if (!_refreshPromise) {
        _refreshPromise = (async () => {
          try {
            const res = await axios.post(
              `${AUTH_BASE}/auth/refresh`,
              {},
              { withCredentials: true },
            );
            return res.status === 200;
          } catch {
            return false;
          } finally {
            _refreshPromise = null;
          }
        })();
      }

      const refreshed = await _refreshPromise;
      if (refreshed) {
        orig._retry = true;
        return http(orig);
      }

      clearCachedUser();
      authExpiredEvent.dispatchEvent(new Event("expired"));
    }
    return Promise.reject(err);
  },
);

export default http;
