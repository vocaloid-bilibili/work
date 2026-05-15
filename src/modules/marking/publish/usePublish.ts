// src/modules/marking/publish/usePublish.ts
import { useState, useCallback, useRef, useEffect } from "react";
import * as api from "@/core/api/mainEndpoints";
import { streamRanking, streamSnapshot } from "@/core/api/sseStream";
import { collabBase } from "@/core/api/collabClient";
import type { PubFile, FileStatus, Phase, PublishMode } from "./types";
import type { Row } from "@/core/types/collab";
import type { Song } from "@/core/types/catalog";
import { PARTS } from "@/core/types/constants";

interface LinkedSong {
  id: number;
  name: string;
}

function parseOriginals(raw: unknown): LinkedSong[] {
  if (!raw) return [];
  try {
    const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

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

  const recordsRef = useRef(records);
  const includesRef = useRef(includes);
  useEffect(() => {
    recordsRef.current = records;
  });
  useEffect(() => {
    includesRef.current = includes;
  });

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
    try {
      const r = await fetch(`${collabBase()}/mark/tasks/publish/status`, {
        credentials: "include",
      });
      if (!r.ok) return false;
      return !(await r.json()).publishing;
    } catch {
      return false;
    }
  };

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

  const processFile = useCallback(
    async (file: PubFile) => {
      setFStatus((p) => ({ ...p, [file.fileKey]: "downloading" }));
      const dl = await fetch(
        `${collabBase()}/mark/tasks/publish/files/${file.fileKey}`,
        { credentials: "include" },
      );
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
            onError: (e) =>
              fail(e instanceof Error ? e : new Error("导入失败")),
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
            onError: (e) =>
              fail(e instanceof Error ? e : new Error("导入失败")),
          });
        });
      }
      setFStatus((p) => ({ ...p, [file.fileKey]: "done" }));

      fetch(`${collabBase()}/mark/tasks/publish/files/${file.fileKey}`, {
        method: "DELETE",
        credentials: "include",
      }).catch(() => {});
    },
    [log],
  );

  const linkOriginals = useCallback(
    async (signal: AbortSignal) => {
      const recs = recordsRef.current;
      const incs = includesRef.current;

      const withOrig = recs
        .map((r, i) => ({ record: r, index: i }))
        .filter(
          ({ record, index }) =>
            incs[index] && parseOriginals(record._original).length > 0,
        );

      if (withOrig.length === 0) return;

      log(`创建关联关系 (${withOrig.length} 首)…`);
      let ok = 0;
      let fail = 0;

      for (const { record } of withOrig) {
        if (signal.aborted) break;
        const originals = parseOriginals(record._original);
        const songName = String(record.name || "").trim();
        if (!songName) continue;

        try {
          const searchResult = (await api.search("song", songName, 1, 10)) as {
            data?: Song[];
          };
          const songs = Array.isArray(searchResult.data)
            ? searchResult.data
            : [];
          const song = songs.find(
            (s) =>
              s.name === songName || (s.display_name || s.name) === songName,
          );

          if (!song) {
            log(`  ✗「${songName}」未找到对应歌曲，跳过`);
            fail++;
            continue;
          }

          for (const orig of originals) {
            try {
              await api.addSongRelation(orig.id, song.id);
              log(`  ✓「${songName}」→ 原曲「${orig.name}」`);
              ok++;
            } catch {
              log(`  ✗「${songName}」→「${orig.name}」失败`);
              fail++;
            }
          }
        } catch {
          log(`  ✗ 搜索「${songName}」失败`);
          fail++;
        }
      }

      log(`关联创建完成：${ok} 成功${fail > 0 ? `，${fail} 失败` : ""}`);
    },
    [log],
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
        let allOk = true;
        for (const f of fl) {
          if (ctrl.signal.aborted) break;
          try {
            await processFile(f);
          } catch (err: unknown) {
            allOk = false;
            const msg = err instanceof Error ? err.message : "失败";
            setFStatus((p) => ({ ...p, [f.fileKey]: "error" }));
            setFErrors((p) => ({ ...p, [f.fileKey]: msg }));
            log(`${f.filename} 失败: ${msg}`);
          }
        }
        if (ctrl.signal.aborted) return;
        if (allOk) {
          await linkOriginals(ctrl.signal);
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
    [log, runPhase1, processFile, linkOriginals],
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
        setFStatus((p) => ({ ...p, [file.fileKey]: "error" }));
        setFErrors((p) => ({ ...p, [file.fileKey]: msg }));
        log(`${file.filename} 失败: ${msg}`);
      }
    },
    [log, processFile],
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
        setFStatus((p) => ({ ...p, [f.fileKey]: "error" }));
        setFErrors((p) => ({ ...p, [f.fileKey]: msg }));
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
  }, [files, fileSelection, fStatus, log, processFile]);

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
