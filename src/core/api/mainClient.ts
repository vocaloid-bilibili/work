// src/core/api/mainClient.ts
import axios, { type InternalAxiosRequestConfig } from "axios";
import { clearCachedUser, AUTH_BASE } from "../auth/token";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

export const authExpiredEvent = new EventTarget();

const http = axios.create({
  baseURL: "https://api.vocabili.top/v2",
  timeout: 120_000,
  withCredentials: true,
});

let _refreshPromise: Promise<boolean> | null = null;

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
