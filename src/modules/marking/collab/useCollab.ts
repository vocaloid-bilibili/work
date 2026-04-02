// src/modules/marking/collab/useCollab.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collabGet,
  collabUpload,
  collabDownload,
} from "@/core/api/collabClient";
import { useCollabSnapshot } from "./useCollabSnapshot";
import { useCollabOps } from "./useCollabOps";
import { useCollabSocket } from "./useCollabSocket";
import type { Snapshot, MarkOp, Row } from "@/core/types/collab";
import type { Attribution } from "@/core/types/stats";
import type { WsEvent } from "@/core/ws/RealtimeSocket";

export function useCollab(enabled: boolean) {
  const [loading, setLoading] = useState(true);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [records, setRecords] = useState<Row[]>([]);
  const [includes, setIncludes] = useState<boolean[]>([]);
  const [blacklists, setBlacklists] = useState<boolean[]>([]);
  const [attributions, setAttributions] = useState<Attribution[]>([]);
  const [conflict, setConflict] = useState<string | null>(null);
  const initRef = useRef(false);
  const snap = useCollabSnapshot({
    setTaskId,
    setVersion,
    setRecords,
    setIncludes,
    setBlacklists,
    setAttributions,
  });

  const opsRef = useRef<ReturnType<typeof useCollabOps>>(null!);
  const refreshRef = useRef<() => Promise<void>>(null!);
  const wsRef = useRef<{ send: (data: Record<string, unknown>) => void }>(
    null!,
  );

  const handleEvent = useCallback((event: WsEvent) => {
    const ops = opsRef.current;
    const ws = wsRef.current;

    if (event.type === "connected") return;

    if (event.type === "task_joined") {
      const v =
        typeof event.version === "number"
          ? event.version
          : snap.versionRef.current;
      snap.versionRef.current = Math.max(snap.versionRef.current, v);
      setVersion((p) => Math.max(p, v));
      return;
    }

    if (event.type === "operation_committed") {
      const op = event.operation as MarkOp | undefined;
      if (!op) return;
      ops.handleCommitted(
        op,
        typeof event.version === "number"
          ? event.version
          : snap.versionRef.current,
      );
      if (
        op.action === "toggle_include" ||
        op.action === "blacklist" ||
        op.action === "unblacklist"
      ) {
        const profile = (event as any).userProfile;
        setAttributions((prev) => {
          const next = [...prev];
          if (
            op.action === "unblacklist" ||
            (op.action === "toggle_include" && !Boolean(op.value))
          ) {
            next[op.recordIndex] = {};
          } else if (op.action === "toggle_include" && Boolean(op.value)) {
            next[op.recordIndex] = {
              actionByProfile: profile,
              action: "include",
              actionAt: new Date().toISOString(),
            };
          } else if (op.action === "blacklist") {
            next[op.recordIndex] = {
              actionByProfile: profile,
              action: "blacklist",
              actionAt: new Date().toISOString(),
            };
          }
          return next;
        });
      }
      return;
    }

    if (event.type === "operation_conflicted") {
      ops.handleConflict({
        opId: typeof event.opId === "string" ? event.opId : "",
        currentVersion: event.currentVersion as number | undefined,
        recordIndex: event.recordIndex as number | undefined,
        field: event.field as string | undefined,
        currentValue: event.currentValue,
      });
      setConflict(typeof event.message === "string" ? event.message : "冲突");
      void refreshRef.current();
      return;
    }

    if (event.type === "snapshot_reloaded") {
      const s = event.snapshot as Snapshot | undefined;
      if (s) {
        snap.apply(s);
        ops.clearPending();
        setConflict(null);
      }
      return;
    }

    if (event.type === "error") {
      const msg = typeof event.message === "string" ? event.message : "";
      if (msg.includes("join_task") && snap.taskIdRef.current)
        ws.send({ type: "join_task", taskId: snap.taskIdRef.current });
      return;
    }
  }, []);

  const ws = useCollabSocket(handleEvent, enabled);
  wsRef.current = ws;

  const ops = useCollabOps(
    {
      taskIdRef: snap.taskIdRef,
      versionRef: snap.versionRef,
      recordsRef: snap.recordsRef,
      includesRef: snap.includesRef,
      blacklistsRef: snap.blacklistsRef,
      send: ws.send,
    },
    { setRecords, setIncludes, setBlacklists },
  );
  opsRef.current = ops;

  const refreshSnapshot = useCallback(async () => {
    const tid = snap.taskIdRef.current;
    if (!tid) return;
    await snap.load(tid);
    opsRef.current.clearPending();
    setConflict(null);
  }, [snap]);
  refreshRef.current = refreshSnapshot;

  // 初始化
  useEffect(() => {
    if (!enabled) return;
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      setLoading(true);
      try {
        const active = await collabGet<{ taskId: string; version: number }>(
          "/mark/tasks/active",
        );
        if (active.taskId) {
          await snap.load(active.taskId);
          setConflict(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [enabled, snap]);

  // join task
  useEffect(() => {
    if (!enabled) return;
    if (ws.connState === "connected" && taskId)
      ws.send({ type: "join_task", taskId });
  }, [ws.connState, taskId, enabled, ws]);

  const updateLocalRecord = useCallback(
    (i: number, fn: (r: Row) => Row) => {
      const prev = snap.recordsRef.current;
      if (i < 0 || i >= prev.length) return;
      const updated = fn(prev[i]);
      if (updated === prev[i]) return;
      const next = [...prev];
      next[i] = updated;
      snap.recordsRef.current = next;
      setRecords(next);
    },
    [snap],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const s = await collabUpload<Snapshot>("/mark/tasks", file);
      snap.apply(s);
      opsRef.current.clearPending();
      setConflict(null);
    },
    [snap],
  );

  const exportFile = useCallback(
    async (keepExcluded: boolean) => {
      const tid = snap.taskIdRef.current;
      if (!tid) throw new Error("任务未初始化");
      const { blob, filename } = await collabDownload(
        `/mark/tasks/${tid}/export?keepExcluded=${keepExcluded}`,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [snap],
  );

  const fetchTaskStats = useCallback(
    async (tid?: string) => {
      const id = tid || snap.taskIdRef.current;
      if (!id) return null;
      return collabGet<any>(`/mark/tasks/${id}/stats`);
    },
    [snap],
  );

  const fetchTaskOps = useCallback(
    async (tid: string, limit: number, offset: number) =>
      collabGet<{ ops: any[]; total: number; hasMore: boolean }>(
        `/mark/tasks/${tid}/ops?limit=${limit}&offset=${offset}`,
      ),
    [],
  );

  const fetchTaskList = useCallback(
    () => collabGet<{ tasks: any[] }>("/mark/tasks"),
    [],
  );
  const fetchGlobalStats = useCallback(
    () => collabGet<any>("/mark/tasks/stats/global"),
    [],
  );

  const statusLabel = useMemo(() => {
    if (ws.connState === "connected") return "已连接";
    if (ws.connState === "reconnecting") return "重连中";
    if (ws.connState === "connecting") return "连接中";
    return "离线";
  }, [ws.connState]);

  return {
    loading,
    taskId,
    version,
    records,
    includes,
    blacklists,
    attributions,
    conflict,
    connState: ws.connState,
    statusLabel,
    ...ops,
    updateLocalRecord,
    refreshSnapshot,
    uploadFile,
    exportFile,
    fetchTaskStats,
    fetchTaskOps,
    fetchTaskList,
    fetchGlobalStats,
    reconnect: ws.reconnect,
  };
}
