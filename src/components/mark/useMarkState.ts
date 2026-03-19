import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useCollaborativeMark } from "@/hooks/useCollaborativeMark";
import { exportToExcel } from "@/utils/excel";
import { toast } from "sonner";
import { runExportChecks, type ExportCheckResult } from "./exportCheck";
import type { RecordAttribution } from "@/components/mark/stats/types";

export type LayoutMode = "list" | "grid" | "table";

export interface RecordType {
  [key: string]: any;
  include?: string | boolean;
}

const isFilled = (v: unknown): boolean =>
  v !== undefined && v !== null && String(v).trim() !== "";

function sanitizeCellValue(val: unknown): unknown {
  if (val === null || val === undefined) return "";
  if (typeof val === "object" && val !== null && "richText" in (val as any)) {
    const rt = (val as any).richText;
    if (Array.isArray(rt)) {
      return rt.map((seg: any) => String(seg?.text ?? "")).join("");
    }
    return "";
  }
  if (typeof val === "object" && val !== null && "result" in (val as any)) {
    return sanitizeCellValue((val as any).result);
  }
  if (typeof val === "object" && val !== null && "hyperlink" in (val as any)) {
    return (val as any).text || (val as any).hyperlink || "";
  }
  if (typeof val === "object" && val !== null && !Array.isArray(val)) {
    try {
      return JSON.stringify(val);
    } catch {
      return "";
    }
  }
  if (typeof val === "string" && val.startsWith("http://")) {
    return val.replace(/^http:\/\//, "https://");
  }
  return val;
}

function sanitizeRecord(r: RecordType): RecordType {
  const out: RecordType = {};
  for (const [k, v] of Object.entries(r)) {
    out[k] = sanitizeCellValue(v);
  }
  return out;
}

export function useMarkState() {
  const [allRecords, setAllRecords] = useState<RecordType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [includeEntries, setIncludeEntries] = useState<boolean[]>([]);
  const [blacklistedEntries, setBlacklistedEntries] = useState<boolean[]>([]);
  const [allIncluded, setAllIncluded] = useState(false);
  const [status, setStatus] = useState<"waiting" | "loading" | "loaded">(
    "waiting",
  );
  const [mode, setMode] = useState<"local" | "collab">(() => {
    const saved = localStorage.getItem("mark_mode");
    return saved === "collab" ? "collab" : "local";
  });
  const [collabUploading, setCollabUploading] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const saved = localStorage.getItem("mark_layout");
    if (saved === "grid" || saved === "table") return saved;
    return "list";
  });

  const [originalFileName, setOriginalFileName] = useState<string>("");
  const [exportCheckOpen, setExportCheckOpen] = useState(false);
  const [exportCheckResult, setExportCheckResult] = useState<ExportCheckResult>(
    {
      pending: [],
      missingFields: [],
      nameMatchTitle: [],
      authorMatchUp: [],
      sameAuthorDiffName: [],
      inconsistentEntries: [],
    },
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCollab = mode === "collab";
  const collab = useCollaborativeMark();

  // Derived
  const currentRecords = useMemo(() => {
    const raw = isCollab ? (collab.records as RecordType[]) : allRecords;
    return raw.map(sanitizeRecord);
  }, [isCollab, collab.records, allRecords]);

  const currentIncludeEntries = isCollab
    ? collab.includeEntries
    : includeEntries;
  const currentBlacklistedEntries = isCollab
    ? collab.blacklistedEntries
    : blacklistedEntries;
  const currentRecordAttributions: RecordAttribution[] = isCollab
    ? collab.recordAttributions
    : [];

  const isLoading = isCollab
    ? collab.loading || collabUploading
    : status === "loading";
  const allIncludedValue = isCollab
    ? currentIncludeEntries.every(Boolean)
    : allIncluded;
  const includedCount = currentIncludeEntries.filter(Boolean).length;
  const blacklistedCount = currentBlacklistedEntries.filter(Boolean).length;

  const pendingCount = useMemo(
    () =>
      currentRecords.reduce((sum: number, _: unknown, i: number) => {
        if (!currentIncludeEntries[i] && !currentBlacklistedEntries[i])
          return sum + 1;
        return sum;
      }, 0),
    [currentRecords, currentIncludeEntries, currentBlacklistedEntries],
  );

  const totalPages = Math.ceil(currentRecords.length / pageSize);

  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return currentRecords.slice(start, start + pageSize);
  }, [currentRecords, currentPage, pageSize]);

  useEffect(() => {
    localStorage.setItem("mark_mode", mode);
  }, [mode]);
  useEffect(() => {
    localStorage.setItem("mark_layout", layoutMode);
  }, [layoutMode]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (currentRecords.length > 0) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [currentRecords]);

  // ── Handlers ──

  const handleModeChange = useCallback((checked: boolean) => {
    setMode(checked ? "collab" : "local");
  }, []);

  const handleJumpToRecord = useCallback(
    (index: number) => {
      if (layoutMode === "table") {
        const el = document.getElementById(`record-${index}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-primary", "ring-offset-2");
          setTimeout(
            () =>
              el.classList.remove("ring-2", "ring-primary", "ring-offset-2"),
            2000,
          );
        }
        return;
      }
      const page = Math.floor(index / pageSize) + 1;
      setCurrentPage(page);
      setTimeout(() => {
        const el = document.getElementById(`record-${index}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-primary", "ring-offset-2");
          setTimeout(
            () =>
              el.classList.remove("ring-2", "ring-primary", "ring-offset-2"),
            2000,
          );
        }
      }, 100);
    },
    [layoutMode, pageSize],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [totalPages],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setOriginalFileName(file.name);

      if (isCollab) {
        setCollabUploading(true);
        collab
          .uploadFile(file)
          .then(() => toast.success("上传成功，已进入协同模式"))
          .catch((err: unknown) =>
            toast.error(err instanceof Error ? err.message : "上传失败"),
          )
          .finally(() => setCollabUploading(false));
      } else {
        setStatus("loading");
        const reader = new FileReader();
        reader.onload = (e) => {
          const ab = e.target?.result as ArrayBuffer;
          const worker = new Worker(
            new URL("../../workers/xlsxWorker.ts", import.meta.url),
            { type: "module" },
          );
          worker.postMessage({ file: ab });
          worker.onmessage = (ev) => {
            const raw = ev.data;
            const records = raw.map((r: any) => {
              const obj: Record<string, any> = {};
              for (const [key, val] of Object.entries(r)) {
                obj[key] = sanitizeCellValue(val);
              }
              return obj;
            });
            setAllRecords(records);
            const init = records.map(
              (r: any) =>
                isFilled(r.vocal) &&
                isFilled(r.synthesizer) &&
                isFilled(r.type),
            );
            setIncludeEntries(init);
            setBlacklistedEntries(new Array(records.length).fill(false));
            setCurrentPage(1);
            worker.terminate();
            setStatus("loaded");
          };
          worker.onerror = () => setStatus("waiting");
        };
        reader.readAsArrayBuffer(file);
      }
    },
    [isCollab, collab],
  );

  const handleChangeAll = useCallback(
    (checked: boolean) => {
      if (isCollab) {
        currentIncludeEntries.forEach((v: boolean, i: number) => {
          if (v !== checked && !currentBlacklistedEntries[i])
            collab.toggleInclude(i, checked);
        });
        return;
      }
      setAllIncluded(checked);
      setIncludeEntries((prev) =>
        prev.map((_: boolean, i: number) =>
          blacklistedEntries[i] ? false : checked,
        ),
      );
    },
    [
      isCollab,
      collab,
      currentIncludeEntries,
      currentBlacklistedEntries,
      blacklistedEntries,
    ],
  );

  const handleIncludeChange = useCallback(
    (index: number, checked: boolean) => {
      if (isCollab) {
        collab.toggleInclude(index, checked);
        return;
      }
      setIncludeEntries((prev) => {
        const n = [...prev];
        n[index] = checked;
        return n;
      });
    },
    [isCollab, collab],
  );

  const handleBlacklist = useCallback(
    (index: number) => {
      if (isCollab) {
        collab.blacklistRecord(index);
        return;
      }
      setBlacklistedEntries((prev) => {
        const n = [...prev];
        n[index] = true;
        return n;
      });
      setIncludeEntries((prev) => {
        const n = [...prev];
        n[index] = false;
        return n;
      });
    },
    [isCollab, collab],
  );

  const handleUnblacklist = useCallback(
    (index: number) => {
      if (isCollab) {
        collab.unblacklistRecord(index);
        return;
      }
      setBlacklistedEntries((prev) => {
        const n = [...prev];
        n[index] = false;
        return n;
      });
    },
    [isCollab, collab],
  );

  const handleRecordUpdate = useCallback(
    (index: number, updatedRecord: any) => {
      if (isCollab) {
        const current = currentRecords[index];
        const nextRecord =
          typeof updatedRecord === "function"
            ? updatedRecord(current)
            : updatedRecord;
        if (!nextRecord || typeof nextRecord !== "object") return;
        const changed = Object.entries(nextRecord).filter(
          ([f, v]) => current[f] !== v,
        );
        if (changed.length === 0) return;
        const local = changed.filter(([f]) => f.startsWith("_unconfirmed_"));
        if (local.length > 0) {
          collab.updateLocalRecord(index, (row: Record<string, unknown>) => {
            const n = { ...row };
            for (const [f, v] of local) n[f] = v;
            return n;
          });
        }
        changed
          .filter(([f]) => !f.startsWith("_unconfirmed_"))
          .forEach(([f, v]) => collab.updateField(index, f, v));
        return;
      }
      setAllRecords((prev) => {
        const n = [...prev];
        const obj =
          typeof updatedRecord === "function"
            ? updatedRecord(prev[index])
            : updatedRecord;
        if (n[index] === obj) return prev;
        n[index] = obj;
        return n;
      });
      setIncludeEntries((prev) => {
        const n = [...prev];
        const merged =
          typeof updatedRecord === "function"
            ? updatedRecord(allRecords[index])
            : { ...allRecords[index], ...updatedRecord };
        n[index] =
          isFilled(merged.vocal) &&
          isFilled(merged.synthesizer) &&
          isFilled(merged.type);
        return n;
      });
    },
    [isCollab, collab, currentRecords, allRecords],
  );

  const handleDirectFieldChange = useCallback(
    (realIndex: number, field: string, value: unknown) => {
      if (isCollab) {
        collab.updateField(realIndex, field, value);
        return;
      }
      setAllRecords((prev) => {
        const n = [...prev];
        n[realIndex] = { ...n[realIndex], [field]: value };
        return n;
      });
      if (["vocal", "synthesizer", "type"].includes(field)) {
        setIncludeEntries((prev) => {
          const n = [...prev];
          const r = { ...allRecords[realIndex], [field]: value };
          n[realIndex] =
            isFilled(r.vocal) && isFilled(r.synthesizer) && isFilled(r.type);
          return n;
        });
      }
    },
    [isCollab, collab, allRecords],
  );

  // ── Export ──

  const getExportFileName = useCallback((): string => {
    if (originalFileName) {
      const dot = originalFileName.lastIndexOf(".");
      const base = dot > 0 ? originalFileName.slice(0, dot) : originalFileName;
      return `${base}_标注完成.xlsx`;
    }
    return `标注导出_${new Date().toISOString().slice(0, 10)}.xlsx`;
  }, [originalFileName]);

  const performExport = useCallback(() => {
    if (isCollab) {
      collab
        .exportFile(false)
        .then(() => {
          toast.success("导出成功");
          setExportCheckOpen(false);
        })
        .catch((err: unknown) =>
          toast.error(err instanceof Error ? err.message : "导出失败"),
        );
      return;
    }
    exportToExcel(
      currentRecords,
      currentIncludeEntries,
      false,
      getExportFileName(),
    );
    setExportCheckOpen(false);
  }, [
    isCollab,
    collab,
    currentRecords,
    currentIncludeEntries,
    getExportFileName,
  ]);

  const handleExport = useCallback(() => {
    if (currentRecords.length === 0) {
      toast.error("没有数据可以导出");
      return;
    }

    const result = runExportChecks(
      currentRecords,
      currentIncludeEntries,
      currentBlacklistedEntries,
    );
    setExportCheckResult(result);

    const allClear =
      result.pending.length === 0 &&
      result.missingFields.length === 0 &&
      result.nameMatchTitle.length === 0 &&
      result.authorMatchUp.length === 0 &&
      result.sameAuthorDiffName.length === 0 &&
      result.inconsistentEntries.length === 0;

    if (allClear) {
      performExport();
    } else {
      setExportCheckOpen(true);
    }
  }, [
    currentRecords,
    currentIncludeEntries,
    currentBlacklistedEntries,
    performExport,
  ]);

  return {
    currentRecords,
    pagedData,
    currentIncludeEntries,
    currentBlacklistedEntries,
    currentRecordAttributions,
    currentPage,
    totalPages,
    pageSize,
    handlePageChange,
    includedCount,
    blacklistedCount,
    pendingCount,
    isCollab,
    collab,
    isLoading,
    mode,
    handleModeChange,
    layoutMode,
    setLayoutMode,
    fileInputRef,
    handleFileChange,
    handleChangeAll,
    handleIncludeChange,
    handleBlacklist,
    handleUnblacklist,
    handleRecordUpdate,
    handleDirectFieldChange,
    handleJumpToRecord,
    allIncludedValue,
    handleExport,
    performExport,
    getExportFileName,
    originalFileName,
    exportCheckOpen,
    setExportCheckOpen,
    exportCheckResult,
  };
}
