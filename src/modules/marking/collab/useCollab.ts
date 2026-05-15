// src/modules/marking/collab/useCollab.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { collabGet } from "@/core/api/collabClient";
import { useCollabSnapshot } from "./useCollabSnapshot";
import { useCollabOps } from "./useCollabOps";
import { useCollabSocket } from "./useCollabSocket";
import { useCollabEvents } from "./useCollabEvents";
import { useCollabApi } from "./useCollabApi";
import type { Row } from "@/core/types/collab";
import type { Attribution } from "@/core/types/stats";

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

  // ── snapshot ──

  const snap = useCollabSnapshot({
    setTaskId,
    setVersion,
    setRecords,
    setIncludes,
    setBlacklists,
    setAttributions,
  });

  // ── cross-refs for event handler ──

  const opsRef = useRef<ReturnType<typeof useCollabOps>>(null!);
  const refreshRef = useRef<() => Promise<void>>(null!);
  const wsRef = useRef<{ send: (data: Record<string, unknown>) => void }>(
    null!,
  );

  // ── events ──

  const handleEvent = useCollabEvents({
    snap,
    opsRef,
    wsRef,
    refreshRef,
    setVersion,
    setAttributions,
    setConflict,
  });

  // ── socket ──

  const ws = useCollabSocket(handleEvent, enabled);
  useEffect(() => {
    wsRef.current = ws;
  }, [ws]);

  // ── ops ──

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
  useEffect(() => {
    opsRef.current = ops;
  });

  // ── refresh ──

  const refreshSnapshot = useCallback(async () => {
    const tid = snap.taskIdRef.current;
    if (!tid) return;
    await snap.load(tid);
    opsRef.current.clearPending();
    setConflict(null);
  }, [snap]);
  useEffect(() => {
    refreshRef.current = refreshSnapshot;
  }, [refreshSnapshot]);

  // ── init ──

  useEffect(() => {
    if (!enabled || initRef.current) return;
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
      } catch (err) {
        console.warn(
          "[collab] init failed:",
          err instanceof Error ? err.message : err,
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [enabled, snap]);

  // ── auto join ──

  useEffect(() => {
    if (enabled && ws.connState === "connected" && taskId) {
      ws.send({ type: "join_task", taskId });
    }
  }, [ws.connState, taskId, enabled, ws]);

  // ── local record update (修复 #5: 归还给 collab 层) ──

  const updateLocalRecord = useCallback(
    (i: number, fn: (r: Row) => Row) => {
      const prev = snap.recordsRef.current;
      if (i < 0 || i >= prev.length) return;
      const updated = fn(prev[i]);
      if (updated === prev[i]) return;
      const next = [...prev];
      next[i] = updated;
      snap.setRecordsRef(next);
      setRecords(next);
    },
    [snap],
  );

  // ── API layer ──

  const api = useCollabApi(snap.taskIdRef);

  const uploadFile = useCallback(
    async (file: File) => {
      const s = await api.uploadTask(file);
      snap.apply(s);
      opsRef.current.clearPending();
      setConflict(null);
    },
    [snap, api],
  );

  const exportFile = useCallback(
    async (keepExcluded: boolean) => {
      const tid = snap.taskIdRef.current;
      if (!tid) throw new Error("任务未初始化");
      await api.exportTask(tid, keepExcluded);
    },
    [snap, api],
  );

  // ── status ──

  const statusLabel = useMemo(() => {
    if (ws.connState === "connected") return "已连接";
    if (ws.connState === "reconnecting") return "重连中";
    if (ws.connState === "connecting") return "连接中";
    return "离线";
  }, [ws.connState]);

  return {
    // state
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

    // ops (分组返回)
    ...ops,
    updateLocalRecord,
    refreshSnapshot,

    // file
    uploadFile,
    exportFile,

    // api (分组)
    ...api,

    // socket
    reconnect: ws.reconnect,
  };
}
