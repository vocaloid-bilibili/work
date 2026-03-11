import { getValidAccessToken } from "@/utils/auth";

const COLLAB_BASE = "https://api.vocabili.top/collab";

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

export const collabBase = COLLAB_BASE;

export const getCollabBase = (): string => {
  return COLLAB_BASE;
};

export async function requestCollabJson<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body } = options;
  const token = await getValidAccessToken();

  const response = await fetch(`${COLLAB_BASE}${path}`, {
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
