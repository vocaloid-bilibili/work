// src/core/api/mainClient.ts
import axios, { type InternalAxiosRequestConfig } from "axios";
import { validToken, refreshAccessToken, clearTokens } from "../auth/token";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

export const authExpiredEvent = new EventTarget();

const http = axios.create({
  baseURL: "https://api.vocabili.top/v2",
  timeout: 120_000,
});

http.interceptors.request.use(async (cfg) => {
  const t = await validToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

http.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config as InternalAxiosRequestConfig | undefined;
    if (err.response?.status === 401 && orig && !orig._retry) {
      orig._retry = true;
      const t = await refreshAccessToken();
      if (t) {
        orig.headers.Authorization = `Bearer ${t}`;
        return http(orig);
      }
      clearTokens();
      authExpiredEvent.dispatchEvent(new Event("expired"));
    }
    return Promise.reject(err);
  },
);

export default http;
