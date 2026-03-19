import { useState, useCallback, useRef } from "react";

export function useRowSelection(totalRows: number) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const lastClickedRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragValueRef = useRef(true); // true = select, false = deselect

  const toggle = useCallback((row: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(row)) next.delete(row);
      else next.add(row);
      return next;
    });
    lastClickedRef.current = row;
  }, []);

  const rangeSelect = useCallback((row: number) => {
    const anchor = lastClickedRef.current ?? 0;
    const start = Math.min(anchor, row);
    const end = Math.max(anchor, row);
    setSelected((prev) => {
      const next = new Set(prev);
      for (let i = start; i <= end; i++) next.add(i);
      return next;
    });
    lastClickedRef.current = row;
  }, []);

  const handleClick = useCallback(
    (row: number, e: React.MouseEvent) => {
      if (e.shiftKey) {
        rangeSelect(row);
      } else if (e.ctrlKey || e.metaKey) {
        toggle(row);
      } else {
        // 单击：如果只选了自己则取消，否则只选自己
        setSelected((prev) => {
          if (prev.size === 1 && prev.has(row)) return new Set();
          return new Set([row]);
        });
        lastClickedRef.current = row;
      }
    },
    [toggle, rangeSelect],
  );

  // 拖拽选择
  const startDrag = useCallback((row: number) => {
    isDraggingRef.current = true;
    setSelected((prev) => {
      const willSelect = !prev.has(row);
      dragValueRef.current = willSelect;
      const next = new Set(prev);
      if (willSelect) next.add(row);
      else next.delete(row);
      return next;
    });
    lastClickedRef.current = row;
  }, []);

  const onDragEnter = useCallback((row: number) => {
    if (!isDraggingRef.current) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (dragValueRef.current) next.add(row);
      else next.delete(row);
      return next;
    });
  }, []);

  const endDrag = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const selectAll = useCallback(() => {
    const all = new Set<number>();
    for (let i = 0; i < totalRows; i++) all.add(i);
    setSelected(all);
  }, [totalRows]);

  const selectNone = useCallback(() => {
    setSelected(new Set());
  }, []);

  // 选中所有 "待处理" 的行（既没收录也没排除）
  const selectPending = useCallback(
    (includeEntries: boolean[], blacklistedEntries: boolean[]) => {
      const next = new Set<number>();
      for (let i = 0; i < totalRows; i++) {
        if (!includeEntries[i] && !blacklistedEntries[i]) next.add(i);
      }
      setSelected(next);
    },
    [totalRows],
  );

  return {
    selected,
    handleClick,
    startDrag,
    onDragEnter,
    endDrag,
    selectAll,
    selectNone,
    selectPending,
  };
}
