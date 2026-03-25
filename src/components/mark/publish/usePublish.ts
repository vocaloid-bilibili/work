// src/components/mark/publish/usePublish.ts

import { useState, useCallback, useRef } from "react";
import api from "@/utils/api";
import type {
  PublishFile,
  FileStatus,
  PublishPhase,
  PublishMode,
} from "./types";

interface UsePublishOptions {
  taskId: string;
}

export function usePublish({ taskId }: UsePublishOptions) {
  const [phase, setPhase] = useState<PublishPhase>("idle");
  const [selectedMode, setSelectedMode] = useState<PublishMode | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [files, setFiles] = useState<PublishFile[]>([]);
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileStatus>>(
    {},
  );
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  const runningRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const busy = phase === "checking" || phase === "phase1" || phase === "phase2";

  const log = useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg]);
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setSelectedMode(null);
    setLogs([]);
    setFiles([]);
    setFileStatuses({});
    setFileErrors({});
    setGlobalError("");
    runningRef.current = false;
    abortRef.current = null;
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    runningRef.current = false;
    setPhase("error");
    setGlobalError("已手动取消");
    log("已手动取消");
  }, [log]);

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

  // ── Phase 1: 调后端（按 mode 决定做什么），拿回文件列表 ──

  const runPhase1 = async (
    mode: PublishMode,
    signal: AbortSignal,
  ): Promise<PublishFile[]> => {
    const token = localStorage.getItem("access_token") || "";
    const res = await fetch(`/collab/mark/tasks/${taskId}/publish`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode }),
      signal,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: "请求失败" }));
      throw new Error(body.message || `HTTP ${res.status}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fileList: PublishFile[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          log(event.message);
          if (event.step === "done" && event.files) fileList = event.files;
          if (event.error) throw new Error(event.message);
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }

    if (fileList.length === 0) throw new Error("服务器未返回文件列表");
    return fileList;
  };

  // ── Phase 2: 逐文件下载→上传→导入（前端做）──

  const processFile = async (file: PublishFile) => {
    const token = localStorage.getItem("access_token") || "";

    // 下载
    setFileStatuses((p) => ({ ...p, [file.fileKey]: "downloading" }));
    const dlRes = await fetch(
      `/collab/mark/tasks/publish/files/${file.fileKey}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!dlRes.ok) throw new Error(`下载 ${file.filename} 失败`);

    const blob = await dlRes.blob();
    const fileObj = new File([blob], file.filename, { type: blob.type });

    // 上传到 Python API
    setFileStatuses((p) => ({ ...p, [file.fileKey]: "uploading" }));
    log(`上传 ${file.filename}`);
    await api.uploadFile(fileObj, { onProgress: () => {} });

    // 导入
    setFileStatuses((p) => ({ ...p, [file.fileKey]: "importing" }));

    if (file.type === "board") {
      const label = file.part === "new" ? "新曲榜" : "主榜";
      log(`导入${label}第${file.issue}期`);
      await new Promise<void>((resolve, reject) => {
        api.updateRanking(file.board, file.part, file.issue, false, {
          onProgress: (msg: string) => log(`  ${msg}`),
          onComplete: () => {
            log(`${label}第${file.issue}期导入完成`);
            resolve();
          },
          onError: (err: any) => reject(new Error(err?.message || "导入失败")),
        });
      });
    } else {
      log(`导入快照 ${file.date}`);
      await new Promise<void>((resolve, reject) => {
        api.updateSnapshot(file.date, false, {
          onProgress: (msg: string) => log(`  ${msg}`),
          onComplete: () => {
            log(`快照 ${file.date} 导入完成`);
            resolve();
          },
          onError: (err: any) => reject(new Error(err?.message || "导入失败")),
        });
      });
    }

    setFileStatuses((p) => ({ ...p, [file.fileKey]: "done" }));

    // 清理临时文件
    fetch(`/collab/mark/tasks/publish/files/${file.fileKey}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  };

  // ── 主流程 ──

  const startPublish = useCallback(
    async (mode: PublishMode) => {
      if (runningRef.current) return;
      runningRef.current = true;

      const controller = new AbortController();
      abortRef.current = controller;

      setSelectedMode(mode);
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
        log("发布被锁定，请等待当前任务完成");
        runningRef.current = false;
        return;
      }

      try {
        // Phase 1: 后端处理（按 mode 决定做导出上传处理/下载/只找文件）
        setPhase("phase1");
        const fileList = await runPhase1(mode, controller.signal);
        setFiles(fileList);
        setFileStatuses(
          Object.fromEntries(
            fileList.map((f) => [f.fileKey, "pending" as const]),
          ),
        );

        // Phase 2: 前端逐文件下载→上传→导入
        setPhase("phase2");
        let allDone = true;
        for (const file of fileList) {
          if (controller.signal.aborted) break;
          try {
            await processFile(file);
          } catch (err: any) {
            allDone = false;
            setFileStatuses((p) => ({ ...p, [file.fileKey]: "error" }));
            setFileErrors((p) => ({
              ...p,
              [file.fileKey]: err.message || "失败",
            }));
            log(`${file.filename} 失败: ${err.message}`);
          }
        }

        if (controller.signal.aborted) return;

        if (allDone) {
          setPhase("done");
          log("全部发布完成");
        } else {
          setPhase("error");
          setGlobalError("部分文件处理失败");
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setPhase("error");
        setGlobalError(err.message || "发布失败");
        log(err.message || "发布失败");
      } finally {
        runningRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [taskId],
  );

  // ── 重试单个文件 ──

  const retryFile = useCallback(
    async (file: PublishFile) => {
      setFileErrors((p) => {
        const next = { ...p };
        delete next[file.fileKey];
        return next;
      });
      try {
        await processFile(file);
        setFileStatuses((prev) => {
          const next = { ...prev, [file.fileKey]: "done" as const };
          if (Object.values(next).every((s) => s === "done")) {
            setPhase("done");
            setGlobalError("");
            log("全部发布完成");
          }
          return next;
        });
      } catch (err: any) {
        setFileStatuses((p) => ({ ...p, [file.fileKey]: "error" }));
        setFileErrors((p) => ({
          ...p,
          [file.fileKey]: err.message || "失败",
        }));
        log(`${file.filename} 失败: ${err.message}`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return {
    phase,
    selectedMode,
    logs,
    files,
    fileStatuses,
    fileErrors,
    globalError,
    busy,
    startPublish,
    retryFile,
    abort,
    reset,
  };
}
