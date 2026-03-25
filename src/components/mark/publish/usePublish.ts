// src/components/mark/publish/usePublish.ts

import { useState, useCallback, useRef } from "react";
import type { PublishFile, FileStatus, PublishPhase } from "./types";

interface UsePublishOptions {
  taskId: string;
}

const STEP_TO_STATUS: Record<string, FileStatus> = {
  import_upload: "uploading",
  import_start: "importing",
  import_progress: "importing",
  import_done: "done",
  import_error: "error",
};

export function usePublish({ taskId }: UsePublishOptions) {
  const [phase, setPhase] = useState<PublishPhase>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [files, setFiles] = useState<PublishFile[]>([]);
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileStatus>>(
    {},
  );
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  const runningRef = useRef(false);

  const busy = phase === "checking" || phase === "running";

  const log = useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg]);
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setLogs([]);
    setFiles([]);
    setFileStatuses({});
    setFileErrors({});
    setGlobalError("");
    runningRef.current = false;
  }, []);

  // ── 检查发布锁 ──

  const checkLock = async (): Promise<boolean> => {
    const token = localStorage.getItem("access_token") || "";
    try {
      const res = await fetch("/collab/mark/tasks/publish/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return false;
      const data = await res.json();
      return !data.publishing;
    } catch {
      return false;
    }
  };

  // ── 处理单条 NDJSON 事件 ──

  const handleEvent = useCallback(
    (event: {
      step: string;
      message: string;
      error?: boolean;
      fileKey?: string;
      files?: PublishFile[];
    }) => {
      log(event.message);

      // Phase 1 完成，拿到文件列表
      if (event.step === "done" && event.files) {
        setFiles(event.files);
        setFileStatuses(
          Object.fromEntries(
            event.files.map((f) => [f.fileKey, "pending" as const]),
          ),
        );
      }

      // 文件级进度
      const fileKey = event.fileKey;
      const status = STEP_TO_STATUS[event.step];
      if (fileKey && status) {
        setFileStatuses((prev) => ({ ...prev, [fileKey]: status }));

        if (event.step === "import_error") {
          setFileErrors((prev) => ({
            ...prev,
            [fileKey]: event.message,
          }));
        }
      }

      // 全部完成
      if (event.step === "all_done") {
        setPhase("done");
      }

      // 全局错误
      if (event.error && !fileKey) {
        throw new Error(event.message);
      }

      // 部分失败警告
      if (event.step === "warning") {
        setPhase("error");
        setGlobalError(event.message);
      }
    },
    [log],
  );

  // ── 主流程：一条流搞定 ──

  const startPublish = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    setLogs([]);
    setFiles([]);
    setFileStatuses({});
    setFileErrors({});
    setGlobalError("");

    // 检查锁
    setPhase("checking");
    const canProceed = await checkLock();
    if (!canProceed) {
      setPhase("error");
      setGlobalError("已有其他发布任务正在进行中，请稍后重试");
      log("❌ 发布被锁定，请等待当前任务完成");
      runningRef.current = false;
      return;
    }

    setPhase("running");

    try {
      const token = localStorage.getItem("access_token") || "";
      const res = await fetch(`/collab/mark/tasks/${taskId}/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: "请求失败" }));
        throw new Error(body.message || `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            handleEvent(JSON.parse(line));
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      // 流结束后，如果 phase 没被设为 done/error，根据文件状态判断
      setPhase((prev) => {
        if (prev === "done" || prev === "error") return prev;
        return "done";
      });
    } catch (err: any) {
      setPhase("error");
      setGlobalError(err.message || "发布失败");
      log(err.message || "发布失败");
    } finally {
      runningRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, handleEvent]);

  return {
    phase,
    logs,
    files,
    fileStatuses,
    fileErrors,
    globalError,
    busy,
    startPublish,
    reset,
  };
}
