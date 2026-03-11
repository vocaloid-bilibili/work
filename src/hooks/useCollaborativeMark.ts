import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { requestCollabJson, getCollabBase } from "@/utils/collabApi";
import { getValidAccessToken } from "@/utils/auth";
import { CollabClient, type ConnectionStatus, type ServerEvent } from "@/utils/collabClient";

export type MarkAction = "set" | "toggle_include";

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
  serverTime: string;
  svmode: boolean;
}

const createOpId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `op-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const applyOperationToLocal = (
  operation: Pick<MarkOperation, "action" | "recordIndex" | "field" | "value">,
  records: Array<Record<string, unknown>>,
  includeEntries: boolean[],
): { records: Array<Record<string, unknown>>; includeEntries: boolean[] } => {
  const nextRecords = [...records];
  const nextInclude = [...includeEntries];

  if (operation.recordIndex < 0 || operation.recordIndex >= nextRecords.length) {
    return { records, includeEntries };
  }

  if (operation.action === "toggle_include") {
    nextInclude[operation.recordIndex] = Boolean(operation.value);
    return { records: nextRecords, includeEntries: nextInclude };
  }

  if (operation.action === "set") {
    const row = { ...nextRecords[operation.recordIndex] };
    row[operation.field] = operation.value;
    nextRecords[operation.recordIndex] = row;
  }

  return { records: nextRecords, includeEntries: nextInclude };
};

export function useCollaborativeMark() {
  const [loading, setLoading] = useState(true);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [records, setRecords] = useState<Array<Record<string, unknown>>>([]);
  const [includeEntries, setIncludeEntries] = useState<boolean[]>([]);
  const [svmode, setSvmode] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionStatus>("offline");
  const [conflict, setConflict] = useState<string | null>(null);

  const clientRef = useRef<CollabClient | null>(null);
  const recordsRef = useRef(records);
  const includeRef = useRef(includeEntries);
  const versionRef = useRef(version);
  const pendingOpsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  useEffect(() => {
    includeRef.current = includeEntries;
  }, [includeEntries]);

  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  const pendingCount = pendingOpsRef.current.size;

  const loadSnapshot = useCallback(async (currentTaskId: string) => {
    const snapshot = await requestCollabJson<MarkTaskSnapshot>(
      `/mark/tasks/${currentTaskId}/snapshot`,
    );
    setTaskId(snapshot.taskId);
    setVersion(snapshot.version);
    setRecords(snapshot.records);
    setIncludeEntries(snapshot.includeEntries);
    setSvmode(snapshot.svmode);
  }, []);

  const initTask = useCallback(async () => {
    setLoading(true);
    try {
      const active = await requestCollabJson<{ taskId: string; version: number }>(
        "/mark/tasks/active",
      );
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
          typeof event.version === "number" ? event.version : versionRef.current;
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
        );
        setRecords(result.records);
        setIncludeEntries(result.includeEntries);
        if (typeof event.version === "number") {
          setVersion(event.version);
        }
        pendingOpsRef.current.delete(operation.opId);
        return;
      }

      if (event.type === "operation_conflicted") {
        const opId = typeof event.opId === "string" ? event.opId : "";
        if (opId) {
          pendingOpsRef.current.delete(opId);
        }
        const message =
          typeof event.message === "string" ? event.message : "发生冲突";
        setConflict(message);
        void refreshSnapshot();
        return;
      }

      if (event.type === "snapshot_reloaded") {
        const snapshot = event.snapshot as MarkTaskSnapshot | undefined;
        if (!snapshot) return;
        setTaskId(snapshot.taskId);
        setVersion(snapshot.version);
        setRecords(snapshot.records);
        setIncludeEntries(snapshot.includeEntries);
        setSvmode(snapshot.svmode);
        pendingOpsRef.current.clear();
        setConflict(null);
      }
    },
    [refreshSnapshot],
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
    if (!clientRef.current || connectionState !== "connected" || !taskId) {
      return;
    }
    clientRef.current.send({ type: "join_task", taskId });
  }, [connectionState, taskId]);

  const submitOperation = useCallback(
    (input: { recordIndex: number; field: string; action: MarkAction; value: unknown }) => {
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
      );
      setRecords(result.records);
      setIncludeEntries(result.includeEntries);
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

  const updateLocalRecord = useCallback(
    (recordIndex: number, updater: (row: Record<string, unknown>) => Record<string, unknown>) => {
      setRecords((prev) => {
        if (recordIndex < 0 || recordIndex >= prev.length) {
          return prev;
        }
        const next = [...prev];
        const updated = updater(next[recordIndex]);
        if (updated === next[recordIndex]) {
          return prev;
        }
        next[recordIndex] = updated;
        return next;
      });
    },
    [],
  );

  const uploadFile = useCallback(async (file: File, svmodeValue: boolean) => {
    const token = await getValidAccessToken();
    if (!token) {
      throw new Error("未登录");
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("svmode", String(svmodeValue));

    const response = await fetch(`${getCollabBase()}/mark/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const payload = (await response.json().catch(() => ({}))) as
      | MarkTaskSnapshot
      | { message?: string };
    if (!response.ok) {
      const message = (payload as { message?: string }).message || "上传失败";
      throw new Error(message);
    }

    const snapshot = payload as MarkTaskSnapshot;
    setTaskId(snapshot.taskId);
    setVersion(snapshot.version);
    setRecords(snapshot.records);
    setIncludeEntries(snapshot.includeEntries);
    setSvmode(snapshot.svmode);
    pendingOpsRef.current.clear();
    setConflict(null);
  }, []);

  const exportFile = useCallback(async (keepExcluded: boolean) => {
    const token = await getValidAccessToken();
    if (!token || !taskId) {
      throw new Error("未登录或任务未初始化");
    }
    const response = await fetch(
      `${getCollabBase()}/mark/tasks/${taskId}/export?keepExcluded=${keepExcluded ? "true" : "false"}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new Error(payload.message || "导出失败");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `export-${taskId}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [taskId]);

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
    svmode,
    conflict,
    connectionState,
    statusLabel,
    pendingCount,
    updateField,
    toggleInclude,
    updateLocalRecord,
    refreshSnapshot,
    uploadFile,
    exportFile,
    reconnect: () => {
      clientRef.current?.disconnect();
      connectClient();
    },
  };
}
