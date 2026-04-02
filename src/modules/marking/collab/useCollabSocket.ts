// src/modules/marking/collab/useCollabSocket.ts
import { useCallback, useEffect, useRef, useState } from "react";
import {
  RealtimeSocket,
  type ConnState,
  type WsEvent,
} from "@/core/ws/RealtimeSocket";
import { collabBase } from "@/core/api/collabClient";
import { validToken } from "@/core/auth/token";

export function useCollabSocket(
  onMessage: (e: WsEvent) => void,
  enabled = true,
) {
  const [connState, setConnState] = useState<ConnState>("offline");
  const socketRef = useRef<RealtimeSocket | null>(null);
  const onMsgRef = useRef(onMessage);
  useEffect(() => {
    onMsgRef.current = onMessage;
  }, [onMessage]);

  const initRef = useRef<() => void>(undefined);

  initRef.current = () => {
    const ws = new RealtimeSocket({
      urlProvider: async () => {
        const u = new URL(collabBase());
        u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
        u.pathname = u.pathname.replace(/\/$/, "") + "/ws";
        return u.toString();
      },
      tokenProvider: () => validToken().then((t) => t || null),
      onMessage: (e) => onMsgRef.current(e),
      onStatus: setConnState,
    });
    socketRef.current = ws;
    ws.connect();
  };

  useEffect(() => {
    if (!enabled) return;
    initRef.current?.();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  const send = useCallback(
    (data: Record<string, unknown>) => socketRef.current?.send(data),
    [],
  );

  const reconnect = useCallback(() => {
    socketRef.current?.disconnect();
    initRef.current?.();
  }, []);

  return { connState, send, reconnect };
}
