// src/core/api/sseStream.ts
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { authHeaders } from "../auth/token";

const BASE = "https://api.vocabili.top/v2";

interface SSEHandlers {
  onProgress?: (msg: string) => void;
  onComplete?: (msg?: string) => void;
  onError?: (err: unknown) => void;
}

export function streamSSE(path: string, handlers: SSEHandlers): () => void {
  const ac = new AbortController();
  (async () => {
    const h = await authHeaders();
    fetchEventSource(`${BASE}${path}`, {
      method: "GET",
      headers: h,
      signal: ac.signal,
      async onopen(res) {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      },
      onmessage(ev) {
        if (ev.event === "progress") handlers.onProgress?.(ev.data);
        else if (ev.event === "complete") {
          handlers.onComplete?.(ev.data);
          ac.abort();
        } else if (ev.event === "error") {
          handlers.onError?.(new Error(ev.data));
          ac.abort();
        }
      },
      onerror(err) {
        handlers.onError?.(err);
        ac.abort();
        throw err;
      },
      openWhenHidden: true,
    }).catch((e) => {
      if (e.name !== "AbortError") handlers.onError?.(e);
    });
  })();
  return () => ac.abort();
}

export const streamRanking = (
  board: string,
  part: string,
  issue: number,
  h: SSEHandlers,
) => streamSSE(`/update/ranking?board=${board}&part=${part}&issue=${issue}`, h);

export const streamSnapshot = (date: string, h: SSEHandlers) =>
  streamSSE(`/update/snapshots?date=${date}`, h);
