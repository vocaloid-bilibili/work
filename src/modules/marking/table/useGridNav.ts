// src/modules/marking/table/useGridNav.ts
import { useState, useCallback } from "react";

export type Cell = { row: number; col: number };

export function useGridNav(rows: number, cols: number) {
  const [active, setActive] = useState<Cell | null>(null);
  const [editing, setEditing] = useState(false);

  const select = useCallback(
    (r: number, c: number) => {
      if (r < 0 || r >= rows) {
        setActive(null);
        setEditing(false);
        return;
      }
      const cc = ((c % cols) + cols) % cols;
      setActive((prev) => {
        if (prev?.row === r && prev?.col === cc) return prev;
        setEditing(false);
        return { row: r, col: cc };
      });
    },
    [rows, cols],
  );

  const clear = useCallback(() => {
    setActive(null);
    setEditing(false);
  }, []);
  const startEdit = useCallback(() => setEditing(true), []);
  const stopEdit = useCallback(() => setEditing(false), []);

  const next = useCallback(
    (r: number, c: number) => {
      if (c + 1 < cols) select(r, c + 1);
      else if (r + 1 < rows) select(r + 1, 0);
      else clear();
    },
    [select, cols, rows, clear],
  );
  const prev = useCallback(
    (r: number, c: number) => {
      if (c - 1 >= 0) select(r, c - 1);
      else if (r > 0) select(r - 1, cols - 1);
      else clear();
    },
    [select, cols, clear],
  );
  const down = useCallback(
    (r: number, c: number) => {
      if (r + 1 < rows) select(r + 1, c);
      else clear();
    },
    [select, rows, clear],
  );
  const up = useCallback(
    (r: number, c: number) => {
      if (r - 1 >= 0) select(r - 1, c);
    },
    [select],
  );

  return {
    active,
    select,
    clear,
    editing,
    startEdit,
    stopEdit,
    next,
    prev,
    down,
    up,
  };
}
