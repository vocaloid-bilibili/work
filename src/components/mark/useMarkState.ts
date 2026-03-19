import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useCollaborativeMark } from "@/hooks/useCollaborativeMark";
import { exportToExcel } from "@/utils/excel";
import { toast } from "sonner";
import { useBookmarks } from "@/contexts/BookmarksContext";

export type LayoutMode = "list" | "grid" | "table";

export interface RecordType {
  [key: string]: any;
  include?: string | boolean;
}

const REQUIRED_FIELDS = [
  "name",
  "vocal",
  "author",
  "synthesizer",
  "copyright",
  "type",
];
const TAG_FIELDS = ["vocal", "author", "synthesizer"];
const FIELD_LABELS: Record<string, string> = {
  name: "歌名",
  vocal: "歌手",
  author: "作者",
  synthesizer: "引擎",
  copyright: "版权",
  type: "类别",
};

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
  const [openSearch, setOpenSearch] = useState(false);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const saved = localStorage.getItem("mark_layout");
    if (saved === "grid" || saved === "table") return saved;
    return "list";
  });
  const [keepExcluded, setKeepExcluded] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [incompleteDialogOpen, setIncompleteDialogOpen] = useState(false);
  const [incompleteIndices, setIncompleteIndices] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCollab = mode === "collab";
  const collab = useCollaborativeMark();
  const { addBookmarksBatch } = useBookmarks();

  // Derived
  const currentRecords = isCollab
    ? (collab.records as RecordType[])
    : allRecords;
  const currentIncludeEntries = isCollab
    ? collab.includeEntries
    : includeEntries;
  const currentBlacklistedEntries = isCollab
    ? collab.blacklistedEntries
    : blacklistedEntries;
  const isLoading = isCollab
    ? collab.loading || collabUploading
    : status === "loading";
  const allIncludedValue = isCollab
    ? currentIncludeEntries.every(Boolean)
    : allIncluded;
  const includedCount = currentIncludeEntries.filter(Boolean).length;
  const blacklistedCount = currentBlacklistedEntries.filter(Boolean).length;
  const pendingCount = currentRecords.length - includedCount;
  const totalPages = Math.ceil(currentRecords.length / pageSize);

  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return currentRecords.slice(start, start + pageSize);
  }, [currentRecords, currentPage, pageSize]);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem("mark_mode", mode);
  }, [mode]);
  useEffect(() => {
    localStorage.setItem("mark_layout", layoutMode);
  }, [layoutMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenSearch((o) => !o);
      }
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setBookmarkOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Unload warning
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
      const page = Math.floor(index / pageSize) + 1;
      setCurrentPage(page);
      setOpenSearch(false);
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
    [pageSize],
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
      if (isCollab) {
        setCollabUploading(true);
        collab
          .uploadFile(file)
          .then(() => toast.success("上传成功，已进入协同模式"))
          .catch((err) =>
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
            const records = ev.data;
            setAllRecords(records);
            let init: boolean[] = [];
            if (records.length > 0) {
              if (records[0].include)
                init = records.map((r: any) => r.include === "收录");
              else if (records[0].status)
                init = records.map((r: any) =>
                  ["done", "auto"].includes(r.status),
                );
              else init = records.map((r: any) => !!r.synthesizer);
            }
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
        currentIncludeEntries.forEach((v, i) => {
          if (v !== checked && !currentBlacklistedEntries[i])
            collab.toggleInclude(i, checked);
        });
        return;
      }
      setAllIncluded(checked);
      setIncludeEntries((prev) =>
        prev.map((_, i) => (blacklistedEntries[i] ? false : checked)),
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
          collab.updateLocalRecord(index, (row) => {
            const n = { ...row } as Record<string, unknown>;
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
    },
    [isCollab, collab, currentRecords],
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
    },
    [isCollab, collab],
  );

  // ── Export ──

  const getProblematicRecords = useCallback(() => {
    const incomplete: number[] = [];
    const unconfirmed: number[] = [];
    currentRecords.forEach((record, index) => {
      if (currentIncludeEntries[index] && !currentBlacklistedEntries[index]) {
        if (
          !REQUIRED_FIELDS.every((f) => {
            const v = record[f];
            return v !== undefined && v !== null && v !== "";
          })
        )
          incomplete.push(index);
        if (
          TAG_FIELDS.some((f) => {
            const v = record[`_unconfirmed_${f}`];
            return !!v && v.trim() !== "";
          })
        )
          unconfirmed.push(index);
      }
    });
    return { incomplete, unconfirmed };
  }, [currentRecords, currentIncludeEntries, currentBlacklistedEntries]);

  const performExport = useCallback(() => {
    exportToExcel(currentRecords, currentIncludeEntries, false, keepExcluded);
    setExportDialogOpen(false);
    setIncompleteDialogOpen(false);
  }, [currentRecords, currentIncludeEntries, keepExcluded]);

  const handleExport = useCallback(() => {
    if (isCollab) {
      collab
        .exportFile(keepExcluded)
        .then(() => {
          toast.success("导出成功");
          setExportDialogOpen(false);
        })
        .catch((err) =>
          toast.error(err instanceof Error ? err.message : "导出失败"),
        );
      return;
    }
    if (!keepExcluded) {
      const { incomplete, unconfirmed } = getProblematicRecords();
      if (incomplete.length > 0 || unconfirmed.length > 0) {
        setIncompleteIndices([...new Set([...incomplete, ...unconfirmed])]);
        setExportDialogOpen(false);
        setIncompleteDialogOpen(true);
        return;
      }
    }
    performExport();
  }, [isCollab, collab, keepExcluded, getProblematicRecords, performExport]);

  const getRecordIssues = useCallback((record: any) => {
    const issues: string[] = [];
    REQUIRED_FIELDS.forEach((f) => {
      const v = record[f];
      if (v === undefined || v === null || v === "")
        issues.push(`${FIELD_LABELS[f]}未填写`);
    });
    TAG_FIELDS.forEach((f) => {
      const v = record[`_unconfirmed_${f}`];
      if (!!v && v.trim() !== "")
        issues.push(`${FIELD_LABELS[f]}栏存在内容未确认`);
    });
    return issues.join("，");
  }, []);

  const handleAddIncompleteToBookmarks = useCallback(() => {
    const bm = incompleteIndices.map((idx) => ({
      index: idx,
      title:
        currentRecords[idx]?.title || currentRecords[idx]?.name || "未命名",
      note: currentRecords[idx]
        ? getRecordIssues(currentRecords[idx])
        : "信息未填写完整",
    }));
    addBookmarksBatch(bm);
    setIncompleteDialogOpen(false);
    if (incompleteIndices.length > 0) handleJumpToRecord(incompleteIndices[0]);
  }, [
    incompleteIndices,
    currentRecords,
    getRecordIssues,
    addBookmarksBatch,
    handleJumpToRecord,
  ]);

  return {
    // data
    currentRecords,
    pagedData,
    currentIncludeEntries,
    currentBlacklistedEntries,
    // pagination
    currentPage,
    totalPages,
    pageSize,
    handlePageChange,
    // counts
    includedCount,
    blacklistedCount,
    pendingCount,
    // mode
    isCollab,
    collab,
    isLoading,
    mode,
    handleModeChange,
    // layout
    layoutMode,
    setLayoutMode,
    // search / bookmarks
    openSearch,
    setOpenSearch,
    bookmarkOpen,
    setBookmarkOpen,
    // actions
    fileInputRef,
    handleFileChange,
    handleChangeAll,
    handleIncludeChange,
    handleBlacklist,
    handleUnblacklist,
    handleRecordUpdate,
    handleDirectFieldChange,
    handleJumpToRecord,
    // all included
    allIncludedValue,
    // export
    handleExport,
    performExport,
    keepExcluded,
    setKeepExcluded,
    exportDialogOpen,
    setExportDialogOpen,
    incompleteDialogOpen,
    setIncompleteDialogOpen,
    incompleteIndices,
    handleAddIncompleteToBookmarks,
  };
}
