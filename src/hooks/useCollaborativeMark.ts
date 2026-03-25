// src/hooks/useCollaborativeMark.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { requestCollabJson, getCollabBase } from "@/utils/collabApi";
import { getValidAccessToken } from "@/utils/auth";
import {
  CollabClient,
  type ConnectionStatus,
  type ServerEvent,
} from "@/utils/collabClient";
import type { RecordAttribution } from "@/components/contributions/types";

export type MarkAction = "set" | "toggle_include" | "blacklist" | "unblacklist";

export interface MarkOperation {
  opId: string;
  taskId: string;
  recordIndex: number;
  field: string;
  action: MarkAction;
  value: unknown;
  baseVersion: number;
  clientTime: string;
}

export interface MarkTaskSnapshot {
  taskId: string;
  version: number;
  records: Array<Record<string, unknown>>;
  includeEntries: boolean[];
  blacklistedEntries: boolean[];
  recordAttributions: RecordAttribution[];
  serverTime: string;
}

const createOpId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    return crypto.randomUUID();
  return `op-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

function sanitizeCellValue(val: unknown): unknown {
  if (val === null || val === undefined) return "";
  if (typeof val === "object" && val !== null && "richText" in (val as any)) {
    const rt = (val as any).richText;
    return Array.isArray(rt)
      ? rt.map((seg: any) => String(seg?.text ?? "")).join("")
      : "";
  }
  if (typeof val === "object" && val !== null && "result" in (val as any))
    return sanitizeCellValue((val as any).result);
  if (typeof val === "object" && val !== null && "hyperlink" in (val as any))
    return (val as any).text || (val as any).hyperlink || "";
  if (typeof val === "object" && val !== null && !Array.isArray(val)) {
    try {
      return JSON.stringify(val);
    } catch {
      return "";
    }
  }
  if (typeof val === "string" && val.startsWith("http://"))
    return val.replace(/^http:\/\//, "https://");
  return val;
}

function sanitizeRecord(r: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k in r) out[k] = sanitizeCellValue(r[k]);
  return out;
}

const applyOperationToLocal = (
  operation: Pick<MarkOperation, "action" | "recordIndex" | "field" | "value">,
  records: Array<Record<string, unknown>>,
  includeEntries: boolean[],
  blacklistedEntries: boolean[],
) => {
  const idx = operation.recordIndex;
  if (idx < 0 || idx >= records.length)
    return { records, includeEntries, blacklistedEntries };

  switch (operation.action) {
    case "toggle_include": {
      const next = [...includeEntries];
      next[idx] = Boolean(operation.value);
      return { records, includeEntries: next, blacklistedEntries };
    }
    case "blacklist": {
      const nextBl = [...blacklistedEntries];
      const nextInc = [...includeEntries];
      nextBl[idx] = true;
      nextInc[idx] = false;
      return { records, includeEntries: nextInc, blacklistedEntries: nextBl };
    }
    case "unblacklist": {
      const next = [...blacklistedEntries];
      next[idx] = false;
      return { records, includeEntries, blacklistedEntries: next };
    }
    case "set": {
      const nextRecords = [...records];
      nextRecords[idx] = {
        ...records[idx],
        [operation.field]: operation.value,
      };
      return { records: nextRecords, includeEntries, blacklistedEntries };
    }
  }
  return { records, includeEntries, blacklistedEntries };
};

// ★ 核心：同步更新 refs + 调度 setState
function commitLocal(
  result: ReturnType<typeof applyOperationToLocal>,
  refs: {
    records: React.MutableRefObject<Array<Record<string, unknown>>>;
    include: React.MutableRefObject<boolean[]>;
    blacklist: React.MutableRefObject<boolean[]>;
  },
  setters: {
    setRecords: React.Dispatch<
      React.SetStateAction<Array<Record<string, unknown>>>
    >;
    setInclude: React.Dispatch<React.SetStateAction<boolean[]>>;
    setBlacklist: React.Dispatch<React.SetStateAction<boolean[]>>;
  },
) {
  if (result.records !== refs.records.current) {
    refs.records.current = result.records; // ★ 同步！
    setters.setRecords(result.records);
  }
  if (result.includeEntries !== refs.include.current) {
    refs.include.current = result.includeEntries; // ★ 同步！
    setters.setInclude(result.includeEntries);
  }
  if (result.blacklistedEntries !== refs.blacklist.current) {
    refs.blacklist.current = result.blacklistedEntries; // ★ 同步！
    setters.setBlacklist(result.blacklistedEntries);
  }
}

export function useCollaborativeMark() {
  const [loading, setLoading] = useState(true);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [records, setRecords] = useState<Array<Record<string, unknown>>>([]);
  const [includeEntries, setIncludeEntries] = useState<boolean[]>([]);
  const [blacklistedEntries, setBlacklistedEntries] = useState<boolean[]>([]);
  const [recordAttributions, setRecordAttributions] = useState<
    RecordAttribution[]
  >([]);
  const [connectionState, setConnectionState] =
    useState<ConnectionStatus>("offline");
  const [conflict, setConflict] = useState<string | null>(null);

  const clientRef = useRef<CollabClient | null>(null);
  const recordsRef = useRef(records);
  const includeRef = useRef(includeEntries);
  const blacklistRef = useRef(blacklistedEntries);
  const versionRef = useRef(version);
  const taskIdRef = useRef(taskId);
  const pendingOpsRef = useRef<Set<string>>(new Set());

  // ★ 保留 useEffect 同步作为后备（snapshot 加载等非 submitOperation 路径）
  useEffect(() => {
    recordsRef.current = records;
  }, [records]);
  useEffect(() => {
    includeRef.current = includeEntries;
  }, [includeEntries]);
  useEffect(() => {
    blacklistRef.current = blacklistedEntries;
  }, [blacklistedEntries]);
  useEffect(() => {
    versionRef.current = version;
  }, [version]);
  useEffect(() => {
    taskIdRef.current = taskId;
  }, [taskId]);

  const refs = {
    records: recordsRef,
    include: includeRef,
    blacklist: blacklistRef,
  };
  const setters = {
    setRecords,
    setInclude: setIncludeEntries,
    setBlacklist: setBlacklistedEntries,
  };

  const pendingCount = pendingOpsRef.current.size;

  const applySnapshot = useCallback((snap: MarkTaskSnapshot) => {
    const recs = snap.records.map(sanitizeRecord);
    const inc = snap.includeEntries;
    const bl =
      snap.blacklistedEntries || new Array(snap.records.length).fill(false);

    setTaskId(snap.taskId);
    taskIdRef.current = snap.taskId;
    setVersion(snap.version);
    versionRef.current = snap.version;

    // ★ 同步更新 refs
    recordsRef.current = recs;
    setRecords(recs);
    includeRef.current = inc;
    setIncludeEntries(inc);
    blacklistRef.current = bl;
    setBlacklistedEntries(bl);

    setRecordAttributions(
      snap.recordAttributions || new Array(snap.records.length).fill({}),
    );
  }, []);

  const loadSnapshot = useCallback(
    async (currentTaskId: string) => {
      const snap = await requestCollabJson<MarkTaskSnapshot>(
        `/mark/tasks/${currentTaskId}/snapshot`,
      );
      applySnapshot(snap);
    },
    [applySnapshot],
  );

  const refreshSnapshot = useCallback(async () => {
    const tid = taskIdRef.current;
    if (!tid) return;
    await loadSnapshot(tid);
    pendingOpsRef.current.clear();
    setConflict(null);
  }, [loadSnapshot]);

  const refreshSnapshotRef = useRef(refreshSnapshot);
  useEffect(() => {
    refreshSnapshotRef.current = refreshSnapshot;
  }, [refreshSnapshot]);

  const handleServerEvent = useCallback(
    (event: ServerEvent) => {
      if (event.type === "task_joined") {
        const v =
          typeof event.version === "number"
            ? event.version
            : versionRef.current;
        versionRef.current = Math.max(versionRef.current, v);
        setVersion((prev) => Math.max(prev, v));
        return;
      }

      if (event.type === "operation_committed") {
        const operation = event.operation as MarkOperation | undefined;
        if (!operation) return;

        const result = applyOperationToLocal(
          operation,
          recordsRef.current,
          includeRef.current,
          blacklistRef.current,
        );
        commitLocal(result, refs, setters);

        if (typeof event.version === "number") {
          const v = event.version;
          versionRef.current = Math.max(versionRef.current, v);
          setVersion(v);
        }
        pendingOpsRef.current.delete(operation.opId);

        const userProfile = (event as any).userProfile as
          | RecordAttribution["actionByProfile"]
          | undefined;
        if (
          operation.action === "toggle_include" ||
          operation.action === "blacklist" ||
          operation.action === "unblacklist"
        ) {
          setRecordAttributions((prev) => {
            const next = [...prev];
            if (operation.action === "unblacklist") {
              next[operation.recordIndex] = {};
            } else if (
              operation.action === "toggle_include" &&
              !Boolean(operation.value)
            ) {
              next[operation.recordIndex] = {};
            } else if (
              operation.action === "toggle_include" &&
              Boolean(operation.value)
            ) {
              next[operation.recordIndex] = {
                actionBy: (operation as any).userId || undefined,
                actionByProfile: userProfile,
                action: "include",
                actionAt: new Date().toISOString(),
              };
            } else if (operation.action === "blacklist") {
              next[operation.recordIndex] = {
                actionBy: (operation as any).userId || undefined,
                actionByProfile: userProfile,
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
        const opId = typeof event.opId === "string" ? event.opId : "";
        if (opId) pendingOpsRef.current.delete(opId);
        if (typeof event.currentVersion === "number")
          versionRef.current = event.currentVersion as number;
        setConflict(
          typeof event.message === "string" ? event.message : "发生冲突",
        );
        void refreshSnapshotRef.current();
        return;
      }

      if (event.type === "snapshot_reloaded") {
        const snap = event.snapshot as MarkTaskSnapshot | undefined;
        if (!snap) return;
        applySnapshot(snap);
        pendingOpsRef.current.clear();
        setConflict(null);
        return;
      }

      if (event.type === "error") {
        const msg = typeof event.message === "string" ? event.message : "";
        if (
          msg.includes("join_task") &&
          taskIdRef.current &&
          clientRef.current
        ) {
          clientRef.current.send({
            type: "join_task",
            taskId: taskIdRef.current,
          });
        }
        return;
      }
    },
    [applySnapshot],
  );

  const handleServerEventRef = useRef(handleServerEvent);
  useEffect(() => {
    handleServerEventRef.current = handleServerEvent;
  }, [handleServerEvent]);

  const initTask = useCallback(async () => {
    setLoading(true);
    try {
      const active = await requestCollabJson<{
        taskId: string;
        version: number;
      }>("/mark/tasks/active");
      if (!active.taskId) {
        setLoading(false);
        return;
      }
      await loadSnapshot(active.taskId);
      setConflict(null);
    } finally {
      setLoading(false);
    }
  }, [loadSnapshot]);

  const connectClient = useCallback(() => {
    const client = new CollabClient({
      baseProvider: getCollabBase,
      tokenProvider: getValidAccessToken,
      onMessage: (evt) => handleServerEventRef.current(evt),
      onStatusChange: (status) => setConnectionState(status),
    });
    clientRef.current = client;
    void client.connect();
  }, []);

  useEffect(() => {
    void initTask();
  }, [initTask]);

  useEffect(() => {
    connectClient();
    return () => {
      clientRef.current?.disconnect();
      clientRef.current = null;
    };
  }, [connectClient]);

  useEffect(() => {
    if (!clientRef.current || connectionState !== "connected" || !taskId)
      return;
    clientRef.current.send({ type: "join_task", taskId });
  }, [connectionState, taskId]);

  const submitOperation = useCallback(
    (input: {
      recordIndex: number;
      field: string;
      action: MarkAction;
      value: unknown;
    }) => {
      if (!taskIdRef.current || !clientRef.current) {
        return;
      }
      const operation: MarkOperation = {
        opId: createOpId(),
        taskId: taskIdRef.current,
        recordIndex: input.recordIndex,
        field: input.field,
        action: input.action,
        value: input.value,
        baseVersion: versionRef.current,
        clientTime: new Date().toISOString(),
      };

      versionRef.current += 1;

      const result = applyOperationToLocal(
        operation,
        recordsRef.current,
        includeRef.current,
        blacklistRef.current,
      );
      commitLocal(result, refs, setters);

      pendingOpsRef.current.add(operation.opId);
      clientRef.current.send({ type: "submit_operation", operation });
    },
    [],
  );

  const updateField = useCallback(
    (recordIndex: number, field: string, value: unknown) => {
      submitOperation({ recordIndex, field, action: "set", value });
    },
    [submitOperation],
  );

  const toggleInclude = useCallback(
    (recordIndex: number, checked: boolean) => {
      submitOperation({
        recordIndex,
        field: "include",
        action: "toggle_include",
        value: checked,
      });
    },
    [submitOperation],
  );

  const blacklistRecord = useCallback(
    (recordIndex: number) => {
      submitOperation({
        recordIndex,
        field: "blacklist",
        action: "blacklist",
        value: true,
      });
    },
    [submitOperation],
  );

  const unblacklistRecord = useCallback(
    (recordIndex: number) => {
      submitOperation({
        recordIndex,
        field: "blacklist",
        action: "unblacklist",
        value: false,
      });
    },
    [submitOperation],
  );

  const updateLocalRecord = useCallback(
    (
      recordIndex: number,
      updater: (row: Record<string, unknown>) => Record<string, unknown>,
    ) => {
      const prev = recordsRef.current;
      if (recordIndex < 0 || recordIndex >= prev.length) return;
      const updated = updater(prev[recordIndex]);
      if (updated === prev[recordIndex]) return;
      const next = [...prev];
      next[recordIndex] = updated;
      recordsRef.current = next; // ★ 同步
      setRecords(next);
    },
    [],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const token = await getValidAccessToken();
      if (!token) throw new Error("未登录");
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${getCollabBase()}/mark/tasks`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const payload = (await response.json().catch(() => ({}))) as
        | MarkTaskSnapshot
        | { message?: string };
      if (!response.ok)
        throw new Error(
          (payload as { message?: string }).message || "上传失败",
        );
      const snap = payload as MarkTaskSnapshot;
      applySnapshot(snap);
      pendingOpsRef.current.clear();
      setConflict(null);
    },
    [applySnapshot],
  );

  const exportFile = useCallback(async (keepExcluded: boolean) => {
    const token = await getValidAccessToken();
    const tid = taskIdRef.current;
    if (!token || !tid) throw new Error("未登录或任务未初始化");
    const response = await fetch(
      `${getCollabBase()}/mark/tasks/${tid}/export?keepExcluded=${keepExcluded}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) {
      const p = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new Error(p.message || "导出失败");
    }
    let fileName = `标注导出_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const disposition = response.headers.get("Content-Disposition");
    if (disposition) {
      const m = disposition.match(/filename\*=UTF-8''(.+)/i);
      if (m) fileName = decodeURIComponent(m[1]);
      else {
        const n = disposition.match(/filename="?([^";\n]+)"?/i);
        if (n) fileName = decodeURIComponent(n[1]);
      }
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const fetchTaskStats = useCallback(async (targetTaskId?: string) => {
    const id = targetTaskId || taskIdRef.current;
    if (!id) return null;
    return requestCollabJson<any>(`/mark/tasks/${id}/stats`);
  }, []);

  const fetchTaskOps = useCallback(
    async (targetTaskId: string, limit: number, offset: number) => {
      return requestCollabJson<{ ops: any[]; total: number; hasMore: boolean }>(
        `/mark/tasks/${targetTaskId}/ops?limit=${limit}&offset=${offset}`,
      );
    },
    [],
  );

  const fetchTaskList = useCallback(async () => {
    return requestCollabJson<{ tasks: any[] }>("/mark/tasks");
  }, []);

  const fetchGlobalStats = useCallback(async () => {
    return requestCollabJson<any>("/mark/tasks/stats/global");
  }, []);

  const statusLabel = useMemo(() => {
    if (connectionState === "connected") return "已连接";
    if (connectionState === "reconnecting") return "重连中";
    if (connectionState === "connecting") return "连接中";
    return "离线";
  }, [connectionState]);

  return {
    loading,
    taskId,
    version,
    records,
    includeEntries,
    blacklistedEntries,
    recordAttributions,
    conflict,
    connectionState,
    statusLabel,
    pendingCount,
    updateField,
    toggleInclude,
    blacklistRecord,
    unblacklistRecord,
    updateLocalRecord,
    refreshSnapshot,
    uploadFile,
    exportFile,
    fetchTaskStats,
    fetchTaskOps,
    fetchTaskList,
    reconnect: () => {
      clientRef.current?.disconnect();
      connectClient();
    },
    fetchGlobalStats,
  };
}
