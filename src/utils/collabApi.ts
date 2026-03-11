import { getValidAccessToken } from "@/utils/auth";

const COLLAB_BASE_KEY = "collab-base";
const ENV_COLLAB_BASE =
  import.meta.env.VITE_COLLAB_API_BASE ?? "http://localhost:8787";

type Method = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: Method;
  body?: unknown;
}

export class CollabApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const collabBase = ENV_COLLAB_BASE;

export const getCollabBase = (): string => {
  return localStorage.getItem(COLLAB_BASE_KEY) || ENV_COLLAB_BASE;
};

export const setCollabBase = (nextBase: string): void => {
  localStorage.setItem(COLLAB_BASE_KEY, nextBase);
};

export async function requestCollabJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body } = options;
  const token = await getValidAccessToken();
  const base = getCollabBase();

  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const maybeJson = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (maybeJson as { message?: string }).message || "请求失败";
    throw new CollabApiError(message, response.status);
  }

  return maybeJson as T;
}
