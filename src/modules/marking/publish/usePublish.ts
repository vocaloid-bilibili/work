// src/modules/marking/publish/usePublish.ts
import { useState, useCallback, useRef } from "react";
import { collabBase } from "@/core/api/collabClient";
import { usePublishFiles } from "./usePublishFiles";
import { usePublishRelations } from "./usePublishRelations";
import { usePublishVocalSupport } from "./usePublishVocalSupport";
import type { PubFile, FileStatus, Phase, PublishMode } from "./types";
import type { Row } from "@/core/types/collab";

export function usePublish({
  taskId,
  records,
  includes,
}: {
  taskId: string;
  records: Row[];
  includes: boolean[];
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [files, setFiles] = useState<PubFile[]>([]);
  const [fStatus, setFStatus] = useState<Record<string, FileStatus>>({});
  const [fErrors, setFErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [fileSelection, setFileSelection] = useState<Record<string, boolean>>(
    {},
  );
  const running = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const busy = phase === "checking" || phase === "phase1" || phase === "phase2";
  const log = useCallback((m: string) => setLogs((p) => [...p, m]), []);

  const setOneStatus = useCallback((key: string, s: FileStatus) => {
    setFStatus((p) => ({ ...p, [key]: s }));
  }, []);

  const setOneError = useCallback((key: string, msg: string) => {
    setFErrors((p) => ({ ...p, [key]: msg }));
  }, []);

  const { processFile } = usePublishFiles({
    setStatus: setOneStatus,
    log,
  });
  const { linkOriginals } = usePublishRelations(records, includes, log);
  const { applyVocalSupport } = usePublishVocalSupport(records, includes, log);

  const reset = useCallback(() => {
    setPhase("idle");
    setLogs([]);
    setFiles([]);
    setFStatus({});
    setFErrors({});
    setGlobalError("");
    setFileSelection({});
    running.current = false;
    abortRef.current = null;
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    running.current = false;
    setPhase("error");
    setGlobalError("已手动取消");
    log("已手动取消");
  }, [log]);

  const toggleFile = useCallback((key: string, v: boolean) => {
    setFileSelection((p) => ({ ...p, [key]: v }));
  }, []);

  const selectAllFiles = useCallback(() => {
    setFileSelection((p) => {
      const n = { ...p };
      for (const f of files) {
        if (fStatus[f.fileKey] !== "done") n[f.fileKey] = true;
      }
      return n;
    });
  }, [files, fStatus]);

  const deselectAll = useCallback(() => setFileSelection({}), []);

  const runPhase1 = useCallback(
    async (mode: PublishMode, signal: AbortSignal): Promise<PubFile[]> => {
      const res = await fetch(`${collabBase()}/mark/tasks/${taskId}/publish`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
        signal,
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({ message: "请求失败" }))) as {
          message?: string;
        };
        throw new Error(b.message || `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let fl: PubFile[] = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const l of lines) {
          if (!l.trim()) continue;
          try {
            const ev = JSON.parse(l) as {
              message: string;
              step?: string;
              files?: PubFile[];
              error?: boolean;
            };
            log(ev.message);
            if (ev.step === "done" && ev.files) fl = ev.files;
            if (ev.error) throw new Error(ev.message);
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
      if (fl.length === 0) throw new Error("服务器未返回文件列表");
      return fl;
    },
    [taskId, log],
  );

  const runPhase2 = useCallback(
    async (fl: PubFile[], signal: AbortSignal) => {
      let allOk = true;
      for (const f of fl) {
        if (signal.aborted) break;
        try {
          await processFile(f);
        } catch (err: unknown) {
          allOk = false;
          const msg = err instanceof Error ? err.message : "失败";
          setOneStatus(f.fileKey, "error");
          setOneError(f.fileKey, msg);
          log(`${f.filename} 失败: ${msg}`);
        }
      }
      return allOk;
    },
    [processFile, setOneStatus, setOneError, log],
  );

  const startPublish = useCallback(
    async (mode: PublishMode) => {
      if (running.current) return;
      running.current = true;
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLogs([]);
      setFiles([]);
      setFStatus({});
      setFErrors({});
      setGlobalError("");
      setFileSelection({});

      setPhase("checking");
      try {
        const lockRes = await fetch(
          `${collabBase()}/mark/tasks/publish/status`,
          { credentials: "include" },
        );
        if (!lockRes.ok || (await lockRes.json()).publishing) {
          setPhase("error");
          setGlobalError("已有其他发布任务");
          log("发布被锁定");
          running.current = false;
          return;
        }
      } catch {
        setPhase("error");
        setGlobalError("检查锁定失败");
        running.current = false;
        return;
      }

      try {
        setPhase("phase1");
        const fl = await runPhase1(mode, ctrl.signal);
        setFiles(fl);
        setFStatus(
          Object.fromEntries(fl.map((f) => [f.fileKey, "pending" as const])),
        );

        setPhase("phase2");
        const allOk = await runPhase2(fl, ctrl.signal);
        if (ctrl.signal.aborted) return;

        if (allOk) {
          // 导入完成后：先设置和声标记，再建关联
          await applyVocalSupport(ctrl.signal);
          if (ctrl.signal.aborted) return;

          await linkOriginals(ctrl.signal);
          if (ctrl.signal.aborted) return;

          setPhase("done");
          log("全部发布完成");
        } else {
          setPhase("error");
          setGlobalError("部分文件失败，可勾选后重新处理");
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "发布失败";
        setPhase("error");
        setGlobalError(msg);
        log(msg);
      } finally {
        running.current = false;
      }
    },
    [log, runPhase1, runPhase2, applyVocalSupport, linkOriginals],
  );

  const retryFile = useCallback(
    async (file: PubFile) => {
      setFErrors((p) => {
        const n = { ...p };
        delete n[file.fileKey];
        return n;
      });
      try {
        await processFile(file);
        setFStatus((prev) => {
          const n = { ...prev, [file.fileKey]: "done" as const };
          if (Object.values(n).every((s) => s === "done")) {
            setPhase("done");
            setGlobalError("");
            log("全部发布完成");
          }
          return n;
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "失败";
        setOneStatus(file.fileKey, "error");
        setOneError(file.fileKey, msg);
        log(`${file.filename} 失败: ${msg}`);
      }
    },
    [log, processFile, setOneStatus, setOneError],
  );

  const retrySelected = useCallback(async () => {
    const toProcess = files.filter(
      (f) => fileSelection[f.fileKey] && fStatus[f.fileKey] !== "done",
    );
    if (!toProcess.length) return;
    running.current = true;
    setPhase("phase2");
    setGlobalError("");
    let allOk = true;
    for (const f of toProcess) {
      try {
        await processFile(f);
      } catch (err: unknown) {
        allOk = false;
        const msg = err instanceof Error ? err.message : "失败";
        setOneStatus(f.fileKey, "error");
        setOneError(f.fileKey, msg);
        log(`${f.filename} 失败: ${msg}`);
      }
    }
    running.current = false;
    setFileSelection({});
    setFStatus((prev) => {
      const allDone = Object.values(prev).every((s) => s === "done");
      if (allDone) {
        setPhase("done");
        log("全部发布完成");
      } else if (!allOk) {
        setPhase("error");
        setGlobalError("部分文件仍然失败");
      }
      return prev;
    });
  }, [
    files,
    fileSelection,
    fStatus,
    log,
    processFile,
    setOneStatus,
    setOneError,
  ]);

  const selectedCount = Object.values(fileSelection).filter(Boolean).length;

  return {
    phase,
    logs,
    files,
    fileStatuses: fStatus,
    fileErrors: fErrors,
    globalError,
    busy,
    fileSelection,
    selectedCount,
    startPublish,
    retryFile,
    retrySelected,
    toggleFile,
    selectAllFiles,
    deselectAll,
    abort,
    reset,
  };
}
