// src/core/api/collabClient.ts
import { clearCachedUser, AUTH_BASE } from "../auth/token";

const BASE = "https://api.vocabili.top/collab";
export const collabBase = () => BASE;

const inFlight = new Map<string, Promise<unknown>>();

async function request<T>(
  url: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const doFetch = () =>
    fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch();

  if (res.status === 401) {
    try {
      const refreshRes = await fetch(`${AUTH_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (refreshRes.ok) {
        res = await doFetch();
      } else {
        clearCachedUser();
        throw new Error("登录已过期");
      }
    } catch (e) {
      clearCachedUser();
      throw e instanceof Error ? e : new Error("登录已过期");
    }
  }

  let json: Record<string, unknown>;
  const text = await res.text();
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    json = {};
  }

  if (!res.ok)
    throw new Error((json.message as string) || `请求失败 (${res.status})`);
  return json as T;
}

export async function collabGet<T>(path: string): Promise<T> {
  const url = `${BASE}${path}`;
  const existing = inFlight.get(url);
  if (existing) return existing as Promise<T>;
  const p = request<T>(url, "GET").finally(() => inFlight.delete(url));
  inFlight.set(url, p);
  return p;
}

export async function collabPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(`${BASE}${path}`, "POST", body);
}

export async function collabUpload<T>(path: string, file: File): Promise<T> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  let json: Record<string, unknown>;
  const text = await res.text();
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    json = {};
  }
  if (!res.ok) throw new Error((json.message as string) || "上传失败");
  return json as T;
}

export async function collabDownload(
  path: string,
): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
  });
  if (!res.ok) {
    let msg = "下载失败";
    try {
      const j = (await res.json()) as { message?: string };
      if (j.message) msg = j.message;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  let filename = `export_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const disp = res.headers.get("Content-Disposition");
  if (disp) {
    const m =
      disp.match(/filename\*=UTF-8''(.+)/i) ||
      disp.match(/filename="?([^";\n]+)"?/i);
    if (m) filename = decodeURIComponent(m[1]);
  }
  return { blob: await res.blob(), filename };
}
