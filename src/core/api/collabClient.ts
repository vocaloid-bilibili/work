// src/core/api/collabClient.ts
import { validToken } from "../auth/token";

const BASE = "https://api.vocabili.top/collab";
export const collabBase = () => BASE;

const inFlight = new Map<string, Promise<unknown>>();

async function request<T>(
  url: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const token = await validToken();
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any).message || "请求失败");
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
  const token = await validToken();
  if (!token) throw new Error("未登录");
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any).message || "上传失败");
  return json as T;
}

export async function collabDownload(
  path: string,
): Promise<{ blob: Blob; filename: string }> {
  const token = await validToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok)
    throw new Error((await res.json().catch(() => ({}))).message || "下载失败");
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
