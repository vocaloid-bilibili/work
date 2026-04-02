// src/modules/marking/state/useMarkOrchestrator.ts
import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { useMarkCore, type LayoutMode } from "./useMarkCore";
import { useMarkPaging } from "./useMarkPaging";
import { useMarkMutations } from "./useMarkMutations";
import { useMarkIO } from "./useMarkIO";
import { useCollab } from "../collab/useCollab";
import type { Attribution } from "@/core/types/stats";
import type { Row } from "@/core/types/collab";

const PAGE_SIZE = 20;

export function useMarkOrchestrator() {
  const core = useMarkCore();
  const collab = useCollab(core.mode === "collab");
  const isCollab = core.mode === "collab";

  // 当前生效的数据
  const activeRecords = useMemo(
    () => (isCollab ? (collab.records as Row[]) : core.records),
    [isCollab, collab.records, core.records],
  );
  const activeIncludes = isCollab ? collab.includes : core.includes;
  const activeBlacklists = isCollab ? collab.blacklists : core.blacklists;
  const activeAttrs: Attribution[] = isCollab
    ? collab.attributions
    : core.attributions;
  const isLoading = isCollab
    ? collab.loading || false
    : core.status === "loading";

  const paging = useMarkPaging({
    records: activeRecords,
    includes: activeIncludes,
    blacklists: activeBlacklists,
    pageSize: PAGE_SIZE,
  });

  const mutations = useMarkMutations({
    isCollab,
    collab,
    records: activeRecords,
    setRecords: core.setRecords,
    includes: activeIncludes,
    setIncludes: core.setIncludes,
    blacklists: activeBlacklists,
    setBlacklists: core.setBlacklists,
  });

  const io = useMarkIO({
    isCollab,
    records: activeRecords,
    includes: activeIncludes,
    blacklists: activeBlacklists,
    fileName: core.fileName,
    setRecords: core.setRecords,
    setIncludes: core.setIncludes,
    setBlacklists: core.setBlacklists,
    setStatus: core.setStatus,
    setFileName: core.setFileName,
    setPage: paging.setPage,
    fileRef: core.fileRef,
    collabUpload: collab.uploadFile,
    collabExport: collab.exportFile,
  });

  // 持久化模式
  useEffect(() => {
    localStorage.setItem("mark_mode", core.mode);
  }, [core.mode]);
  useEffect(() => {
    localStorage.setItem("mark_layout", core.layout);
  }, [core.layout]);

  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const jumpToRecord = useCallback(
    (index: number) => {
      paging.changeFilter(null);

      if (highlightTimer.current) {
        clearTimeout(highlightTimer.current);
        highlightTimer.current = undefined;
      }
      setHighlightIndex(null);

      if (core.layout !== "table") {
        paging.setPage(Math.floor(index / PAGE_SIZE) + 1);
      }

      const delay = core.layout === "table" ? 50 : 100;
      setTimeout(() => {
        const el = document.getElementById(`record-${index}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        setHighlightIndex(index);
        highlightTimer.current = setTimeout(() => {
          setHighlightIndex(null);
        }, 2000);
      }, delay);
    },
    [core.layout, paging],
  );

  return {
    records: activeRecords,
    includes: activeIncludes,
    blacklists: activeBlacklists,
    attributions: activeAttrs,
    isLoading,
    isCollab,
    collab,
    mode: core.mode,
    setMode: core.setMode,
    layout: core.layout as LayoutMode,
    setLayout: core.setLayout,
    ...paging,
    pageSize: PAGE_SIZE,
    ...mutations,
    ...io,
    fileRef: core.fileRef,
    jumpToRecord,
    highlightIndex,
  };
}
