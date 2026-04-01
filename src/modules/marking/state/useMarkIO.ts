// src/modules/marking/state/useMarkIO.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { sanitizeRow, filled } from "@/core/helpers/sanitize";
import type { Row } from "@/core/types/collab";

export interface CheckResult {
  pending: { index: number; title: string }[];
  missingFields: { index: number; title: string; missingLabels: string[] }[];
  nameMatchTitle: { index: number; title: string }[];
  authorMatchUp: { index: number; title: string; detail: string }[];
  sameAuthorDiffName: {
    author: string;
    songs: { index: number; name: string; title: string }[];
  }[];
  inconsistentEntries: {
    key: string;
    author: string;
    name: string;
    inconsistentFields: string[];
    entries: { index: number; title: string; values: Record<string, string> }[];
  }[];
}

const EMPTY_CHECK: CheckResult = {
  pending: [],
  missingFields: [],
  nameMatchTitle: [],
  authorMatchUp: [],
  sameAuthorDiffName: [],
  inconsistentEntries: [],
};

interface Opts {
  isCollab: boolean;
  records: Row[];
  includes: boolean[];
  blacklists: boolean[];
  fileName: string;
  setRecords: React.Dispatch<React.SetStateAction<Row[]>>;
  setIncludes: React.Dispatch<React.SetStateAction<boolean[]>>;
  setBlacklists: React.Dispatch<React.SetStateAction<boolean[]>>;
  setStatus: (s: "idle" | "loading" | "ready") => void;
  setFileName: (n: string) => void;
  setPage: (p: number) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  collabUpload: (f: File) => Promise<void>;
  collabExport: (keep: boolean) => Promise<void>;
}

export function useMarkIO(opts: Opts) {
  const {
    isCollab,
    records,
    includes,
    blacklists,
    fileName,
    setRecords,
    setIncludes,
    setBlacklists,
    setStatus,
    setFileName,
    setPage,
    fileRef,
    collabUpload,
    collabExport,
  } = opts;

  const [uploading, setUploading] = useState(false);
  const [checkOpen, setCheckOpen] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult>(EMPTY_CHECK);

  const loadFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      if (isCollab) {
        setUploading(true);
        collabUpload(file)
          .then(() => toast.success("上传成功"))
          .catch((err) =>
            toast.error(err instanceof Error ? err.message : "上传失败"),
          )
          .finally(() => setUploading(false));
        return;
      }
      setStatus("loading");
      const reader = new FileReader();
      reader.onload = (ev) => {
        const ab = ev.target?.result as ArrayBuffer;
        const w = new Worker(
          new URL("../../../workers/xlsx.worker.ts", import.meta.url),
          { type: "module" },
        );
        w.postMessage({ file: ab });
        w.onmessage = (msg) => {
          if (msg.data && typeof msg.data === "object" && "error" in msg.data) {
            toast.error(`解析失败：${msg.data.error}`);
            w.terminate();
            setStatus("idle");
            return;
          }
          const rows = (msg.data as Row[]).map(sanitizeRow);
          setRecords(rows);
          setIncludes(
            rows.map(
              (r) => filled(r.vocal) && filled(r.synthesizer) && filled(r.type),
            ),
          );
          setBlacklists(new Array(rows.length).fill(false));
          setPage(1);
          w.terminate();
          setStatus("ready");
        };
        w.onerror = () => {
          toast.error("解析文件时发生错误");
          setStatus("idle");
        };
      };
      reader.readAsArrayBuffer(file);
    },
    [
      isCollab,
      collabUpload,
      setRecords,
      setIncludes,
      setBlacklists,
      setPage,
      setStatus,
      setFileName,
    ],
  );

  const doExport = useCallback(async () => {
    if (isCollab) {
      try {
        await collabExport(false);
        toast.success("导出成功");
        setCheckOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "导出失败");
      }
      return;
    }
    const m = await import("./exportExcel");
    await m.exportExcel(records, includes, false, fileName);
    setCheckOpen(false);
  }, [isCollab, collabExport, records, includes, fileName]);

  const tryExport = useCallback(() => {
    if (records.length === 0) {
      toast.error("没有数据");
      return;
    }
    if (!isCollab) {
      doExport();
      return;
    }
    import("../check/ExportChecker").then((m) => {
      const result = m.runChecks(records, includes, blacklists);
      setCheckResult(result);
      const clear =
        result.pending.length === 0 &&
        result.missingFields.length === 0 &&
        result.nameMatchTitle.length === 0 &&
        result.authorMatchUp.length === 0 &&
        result.sameAuthorDiffName.length === 0 &&
        result.inconsistentEntries.length === 0;
      if (clear) doExport();
      else setCheckOpen(true);
    });
  }, [isCollab, records, includes, blacklists, doExport]);

  const reset = useCallback(() => {
    setRecords([]);
    setIncludes([]);
    setBlacklists([]);
    setPage(1);
    setStatus("idle");
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  }, [
    setRecords,
    setIncludes,
    setBlacklists,
    setPage,
    setStatus,
    setFileName,
    fileRef,
  ]);

  return {
    uploading,
    checkOpen,
    setCheckOpen,
    checkResult,
    loadFile,
    tryExport,
    doExport,
    reset,
  };
}
