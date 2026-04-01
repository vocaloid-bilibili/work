// src/modules/marking/publish/usePublish.ts
import { useState, useCallback, useRef } from "react";
import * as api from "@/core/api/mainEndpoints";
import { streamRanking, streamSnapshot } from "@/core/api/sseStream";
import { validToken } from "@/core/auth/token";
import type { PubFile, FileStatus, Phase, PublishMode } from "./types";
import { PARTS } from "@/core/types/constants";

export function usePublish({ taskId }: { taskId: string }) {
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

  const deselectAll = useCallback(() => {
    setFileSelection({});
  }, []);

  const checkLock = async () => {
    const t = await validToken();
    if (!t) return false;
    try {
      const r = await fetch("/collab/mark/tasks/publish/status", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!r.ok) return false;
      return !(await r.json()).publishing;
    } catch {
      return false;
    }
  };

  const runPhase1 = async (
    mode: PublishMode,
    signal: AbortSignal,
  ): Promise<PubFile[]> => {
    const t = await validToken();
    const res = await fetch(`/collab/mark/tasks/${taskId}/publish`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode }),
      signal,
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({ message: "请求失败" }));
      throw new Error(b.message || `HTTP ${res.status}`);
    }
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let fl: PubFile[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const l of lines) {
        if (!l.trim()) continue;
        try {
          const ev = JSON.parse(l);
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
  };

  const processFile = async (file: PubFile) => {
    const t = await validToken();
    setFStatus((p) => ({ ...p, [file.fileKey]: "downloading" }));
    const dl = await fetch(`/collab/mark/tasks/publish/files/${file.fileKey}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!dl.ok) throw new Error(`下载 ${file.filename} 失败`);
    const blob = await dl.blob();
    const fo = new File([blob], file.filename, { type: blob.type });
    setFStatus((p) => ({ ...p, [file.fileKey]: "uploading" }));
    log(`上传 ${file.filename}`);
    await api.uploadFile(fo);
    setFStatus((p) => ({ ...p, [file.fileKey]: "importing" }));
    if (file.type === "board") {
      const label =
        PARTS.find((p) => p.value === file.part)?.label ?? file.part;
      log(`导入${label}第${file.issue}期`);
      await new Promise<void>((ok, fail) => {
        streamRanking(file.board, file.part, file.issue, {
          onProgress: (m) => log(`  ${m}`),
          onComplete: () => {
            log(`${label}第${file.issue}期导入完成`);
            ok();
          },
          onError: (e) => fail(e instanceof Error ? e : new Error("导入失败")),
        });
      });
    } else {
      log(`导入快照 ${file.date}`);
      await new Promise<void>((ok, fail) => {
        streamSnapshot(file.date, {
          onProgress: (m) => log(`  ${m}`),
          onComplete: () => {
            log(`快照 ${file.date} 导入完成`);
            ok();
          },
          onError: (e) => fail(e instanceof Error ? e : new Error("导入失败")),
        });
      });
    }
    setFStatus((p) => ({ ...p, [file.fileKey]: "done" }));
    fetch(`/collab/mark/tasks/publish/files/${file.fileKey}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${t}` },
    }).catch(() => {});
  };

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
      if (!(await checkLock())) {
        setPhase("error");
        setGlobalError("已有其他发布任务");
        log("发布被锁定");
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
        let ok = true;
        for (const f of fl) {
          if (ctrl.signal.aborted) break;
          try {
            await processFile(f);
          } catch (err: any) {
            ok = false;
            setFStatus((p) => ({ ...p, [f.fileKey]: "error" }));
            setFErrors((p) => ({ ...p, [f.fileKey]: err.message || "失败" }));
            log(`${f.filename} 失败: ${err.message}`);
          }
        }
        if (ctrl.signal.aborted) return;
        if (ok) {
          setPhase("done");
          log("全部发布完成");
        } else {
          setPhase("error");
          setGlobalError("部分文件失败，可勾选后重新处理");
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setPhase("error");
        setGlobalError(err.message || "发布失败");
        log(err.message || "发布失败");
      } finally {
        running.current = false;
      }
    },
    [taskId, log],
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
      } catch (err: any) {
        setFStatus((p) => ({ ...p, [file.fileKey]: "error" }));
        setFErrors((p) => ({ ...p, [file.fileKey]: err.message || "失败" }));
        log(`${file.filename} 失败: ${err.message}`);
      }
    },
    [log],
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
      } catch (err: any) {
        allOk = false;
        setFStatus((p) => ({ ...p, [f.fileKey]: "error" }));
        setFErrors((p) => ({ ...p, [f.fileKey]: err.message || "失败" }));
        log(`${f.filename} 失败: ${err.message}`);
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
  }, [files, fileSelection, fStatus, log]);

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
