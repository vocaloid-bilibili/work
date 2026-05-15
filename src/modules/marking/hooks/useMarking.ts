// src/modules/marking/hooks/useMarking.ts
import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { useMarkState, type LayoutMode } from "./useMarkState";
import { useMarkPaging } from "./useMarkPaging";
import { useMarkActions } from "./useMarkActions";
import { useMarkUpload } from "./useMarkUpload";
import { useMarkCheck } from "./useMarkCheck";
import { useCollab } from "../collab/useCollab";
import type { Attribution } from "@/core/types/stats";
import type { Row } from "@/core/types/collab";

const PAGE_SIZE = 20;

export function useMarking() {
  const state = useMarkState();
  const collab = useCollab(state.mode === "collab");
  const isCollab = state.mode === "collab";

  // ── 数据源：本地 or 协同 ──

  const records = useMemo<Row[]>(
    () => (isCollab ? (collab.records as Row[]) : state.records),
    [isCollab, collab.records, state.records],
  );
  const includes = isCollab ? collab.includes : state.includes;
  const blacklists = isCollab ? collab.blacklists : state.blacklists;
  const attributions: Attribution[] = isCollab ? collab.attributions : state.attributions;
  const isLoading = isCollab ? collab.loading || false : state.status === "loading";

  // ── 各功能模块 ──

  const paging = useMarkPaging({ records, includes, blacklists, pageSize: PAGE_SIZE });

  const actions = useMarkActions({
    isCollab, collab, records,
    setRecords: state.setRecords,
    includes, setIncludes: state.setIncludes,
    blacklists, setBlacklists: state.setBlacklists,
  });

  const upload = useMarkUpload({
    isCollab,
    setRecords: state.setRecords,
    setIncludes: state.setIncludes,
    setBlacklists: state.setBlacklists,
    setStatus: state.setStatus,
    setFileName: state.setFileName,
    setPage: paging.setPage,
    fileRef: state.fileRef,
    collabUpload: collab.uploadFile,
  });

  const check = useMarkCheck({ records, includes, blacklists });

  // ── 持久化 ──

  useEffect(() => { localStorage.setItem("mark_mode", state.mode); }, [state.mode]);
  useEffect(() => { localStorage.setItem("mark_layout", state.layout); }, [state.layout]);

  // ── 高亮跳转 ──

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
      paging.setPage(Math.floor(index / PAGE_SIZE) + 1);
      setTimeout(() => {
        document.getElementById(`record-${index}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightIndex(index);
        highlightTimer.current = setTimeout(() => setHighlightIndex(null), 2000);
      }, 100);
    },
    [paging],
  );

  // ── 重置 ──

  const reset = useCallback(() => {
    state.reset();
    paging.setPage(1);
  }, [state, paging]);

  // ── 对外接口 ──

  return {
    // 数据
    records,
    includes,
    blacklists,
    attributions,
    isLoading,

    // 模式 & 布局
    isCollab,
    collab,
    mode: state.mode,
    setMode: state.setMode,
    layout: state.layout as LayoutMode,
    setLayout: state.setLayout,
    fileRef: state.fileRef,

    // 分页
    paging,

    // 编辑操作
    actions,

    // 上传
    loadFile: upload.loadFile,

    // 校验
    check,

    // 跳转
    jumpToRecord,
    highlightIndex,

    // 重置
    reset,
  };
}
