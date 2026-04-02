// src/core/api/collabClient.ts
import { validToken, refreshAccessToken } from "../auth/token";

const BASE = "https://api.vocabili.top/collab";
export const collabBase = () => BASE;

const inFlight = new Map<string, Promise<unknown>>();

async function request<T>(
  url: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const token = await validToken();
  const doFetch = async (t: string | null) => {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res;
  };

  let res = await doFetch(token);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
    }
  }

  let json: any;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }

  if (!res.ok) throw new Error(json.message || `请求失败 (${res.status})`);
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
  let json: any;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }
  if (!res.ok) throw new Error(json.message || "上传失败");
  return json as T;
}

export async function collabDownload(
  path: string,
): Promise<{ blob: Blob; filename: string }> {
  const token = await validToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let msg = "下载失败";
    try {
      const j = await res.json();
      if (j.message) msg = j.message;
    } catch {}
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
