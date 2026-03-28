// src/modules/marking/table/useRowSelect.ts
import { useState, useCallback, useRef } from "react";

export function useRowSelect(total: number) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const lastRef = useRef<number | null>(null);
  const dragging = useRef(false);
  const dragVal = useRef(true);

  const toggle = useCallback((r: number) => {
    setSelected((p) => {
      const n = new Set(p);
      if (n.has(r)) n.delete(r);
      else n.add(r);
      return n;
    });
    lastRef.current = r;
  }, []);
  const range = useCallback((r: number) => {
    const a = lastRef.current ?? 0;
    const s = Math.min(a, r),
      e = Math.max(a, r);
    setSelected((p) => {
      const n = new Set(p);
      for (let i = s; i <= e; i++) n.add(i);
      return n;
    });
    lastRef.current = r;
  }, []);

  const handleClick = useCallback(
    (r: number, e: React.MouseEvent) => {
      if (e.shiftKey) range(r);
      else if (e.ctrlKey || e.metaKey) toggle(r);
      else {
        setSelected((p) =>
          p.size === 1 && p.has(r) ? new Set() : new Set([r]),
        );
        lastRef.current = r;
      }
    },
    [toggle, range],
  );

  const startDrag = useCallback((r: number) => {
    dragging.current = true;
    setSelected((p) => {
      const w = !p.has(r);
      dragVal.current = w;
      const n = new Set(p);
      w ? n.add(r) : n.delete(r);
      return n;
    });
    lastRef.current = r;
  }, []);
  const onDragEnter = useCallback((r: number) => {
    if (!dragging.current) return;
    setSelected((p) => {
      const n = new Set(p);
      dragVal.current ? n.add(r) : n.delete(r);
      return n;
    });
  }, []);
  const endDrag = useCallback(() => {
    dragging.current = false;
  }, []);

  const selectAll = useCallback(() => {
    const a = new Set<number>();
    for (let i = 0; i < total; i++) a.add(i);
    setSelected(a);
  }, [total]);
  const selectNone = useCallback(() => setSelected(new Set()), []);
  const selectPending = useCallback(
    (inc: boolean[], bl: boolean[]) => {
      const n = new Set<number>();
      for (let i = 0; i < total; i++) {
        if (!inc[i] && !bl[i]) n.add(i);
      }
      setSelected(n);
    },
    [total],
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
