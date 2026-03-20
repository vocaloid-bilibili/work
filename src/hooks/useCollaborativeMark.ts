import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { requestCollabJson, getCollabBase } from "@/utils/collabApi";
import { getValidAccessToken } from "@/utils/auth";
import {
  CollabClient,
  type ConnectionStatus,
  type ServerEvent,
} from "@/utils/collabClient";
import type { RecordAttribution } from "@/components/mark/stats/types";

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

const applyOperationToLocal = (
  operation: Pick<MarkOperation, "action" | "recordIndex" | "field" | "value">,
  records: Array<Record<string, unknown>>,
  includeEntries: boolean[],
  blacklistedEntries: boolean[],
): {
  records: Array<Record<string, unknown>>;
  includeEntries: boolean[];
  blacklistedEntries: boolean[];
} => {
  const nextRecords = [...records];
  const nextInclude = [...includeEntries];
  const nextBlacklist = [...blacklistedEntries];

  if (
    operation.recordIndex < 0 ||
    operation.recordIndex >= nextRecords.length
  ) {
    return { records, includeEntries, blacklistedEntries };
  }

  switch (operation.action) {
    case "toggle_include":
      nextInclude[operation.recordIndex] = Boolean(operation.value);
      break;
    case "blacklist":
      nextBlacklist[operation.recordIndex] = true;
      nextInclude[operation.recordIndex] = false;
      break;
    case "unblacklist":
      nextBlacklist[operation.recordIndex] = false;
      break;
    case "set": {
      const row = { ...nextRecords[operation.recordIndex] };
      row[operation.field] = operation.value;
      nextRecords[operation.recordIndex] = row;
      break;
    }
  }

  return {
    records: nextRecords,
    includeEntries: nextInclude,
    blacklistedEntries: nextBlacklist,
  };
};

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
  const pendingOpsRef = useRef<Set<string>>(new Set());

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

  const pendingCount = pendingOpsRef.current.size;

  const applySnapshot = useCallback((snap: MarkTaskSnapshot) => {
    setTaskId(snap.taskId);
    setVersion(snap.version);
    setRecords(snap.records);
    setIncludeEntries(snap.includeEntries);
    setBlacklistedEntries(
      snap.blacklistedEntries || new Array(snap.records.length).fill(false),
    );
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

  const initTask = useCallback(async () => {
    setLoading(true);
    try {
      const active = await requestCollabJson<{
        taskId: string;
        version: number;
      }>("/mark/tasks/active");
      await loadSnapshot(active.taskId);
      setConflict(null);
    } finally {
      setLoading(false);
    }
  }, [loadSnapshot]);

  const refreshSnapshot = useCallback(async () => {
    if (!taskId) return;
    await loadSnapshot(taskId);
    pendingOpsRef.current.clear();
    setConflict(null);
  }, [loadSnapshot, taskId]);

  const handleServerEvent = useCallback(
    (event: ServerEvent) => {
      if (event.type === "task_joined") {
        const nextVersion =
          typeof event.version === "number"
            ? event.version
            : versionRef.current;
        setVersion(nextVersion);
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
        setRecords(result.records);
        setIncludeEntries(result.includeEntries);
        setBlacklistedEntries(result.blacklistedEntries);
        if (typeof event.version === "number") setVersion(event.version);
        pendingOpsRef.current.delete(operation.opId);

        // 更新归属
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
        setConflict(
          typeof event.message === "string" ? event.message : "发生冲突",
        );
        void refreshSnapshot();
        return;
      }

      if (event.type === "snapshot_reloaded") {
        const snap = event.snapshot as MarkTaskSnapshot | undefined;
        if (!snap) return;
        applySnapshot(snap);
        pendingOpsRef.current.clear();
        setConflict(null);
      }
    },
    [refreshSnapshot, applySnapshot],
  );

  useEffect(() => {
    void initTask();
  }, [initTask]);

  const connectClient = useCallback(() => {
    const client = new CollabClient({
      baseProvider: getCollabBase,
      tokenProvider: getValidAccessToken,
      onMessage: handleServerEvent,
      onStatusChange: (status) => setConnectionState(status),
    });
    clientRef.current = client;
    void client.connect();
  }, [handleServerEvent]);

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
      if (!taskId || !clientRef.current) return;
      const operation: MarkOperation = {
        opId: createOpId(),
        taskId,
        recordIndex: input.recordIndex,
        field: input.field,
        action: input.action,
        value: input.value,
        baseVersion: versionRef.current,
        clientTime: new Date().toISOString(),
      };
      const result = applyOperationToLocal(
        operation,
        recordsRef.current,
        includeRef.current,
        blacklistRef.current,
      );
      setRecords(result.records);
      setIncludeEntries(result.includeEntries);
      setBlacklistedEntries(result.blacklistedEntries);
      pendingOpsRef.current.add(operation.opId);
      clientRef.current.send({ type: "submit_operation", operation });
    },
    [taskId],
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
      setRecords((prev) => {
        if (recordIndex < 0 || recordIndex >= prev.length) return prev;
        const next = [...prev];
        const updated = updater(next[recordIndex]);
        if (updated === next[recordIndex]) return prev;
        next[recordIndex] = updated;
        return next;
      });
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
      if (!response.ok) {
        throw new Error(
          (payload as { message?: string }).message || "上传失败",
        );
      }
      const snap = payload as MarkTaskSnapshot;
      applySnapshot(snap);
      pendingOpsRef.current.clear();
      setConflict(null);
    },
    [applySnapshot],
  );

  const exportFile = useCallback(
    async (keepExcluded: boolean) => {
      const token = await getValidAccessToken();
      if (!token || !taskId) throw new Error("未登录或任务未初始化");
      const response = await fetch(
        `${getCollabBase()}/mark/tasks/${taskId}/export?keepExcluded=${keepExcluded}`,
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
        const utf8Match = disposition.match(/filename\*=UTF-8''(.+)/i);
        if (utf8Match) {
          fileName = decodeURIComponent(utf8Match[1]);
        } else {
          const normalMatch = disposition.match(/filename="?([^";\n]+)"?/i);
          if (normalMatch) {
            fileName = decodeURIComponent(normalMatch[1]);
          }
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
    },
    [taskId],
  );

  const fetchTaskStats = useCallback(
    async (targetTaskId?: string) => {
      const id = targetTaskId || taskId;
      if (!id) throw new Error("任务未初始化");
      return requestCollabJson<any>(`/mark/tasks/${id}/stats`);
    },
    [taskId],
  );

  const fetchTaskList = useCallback(async () => {
    return requestCollabJson<{
      tasks: Array<{
        taskId: string;
        recordCount: number;
        createdAt: string;
        closedAt?: string;
        fileMeta?: {
          originalName: string;
          storedPath: string;
          uploadedAt: string;
        };
        contributorCount: number;
        totalOperations: number;
      }>;
    }>("/mark/tasks");
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
    fetchTaskList,
    reconnect: () => {
      clientRef.current?.disconnect();
      connectClient();
    },
  };
}
