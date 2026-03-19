import { useState, useCallback } from "react";

export type CellAddress = { row: number; col: number };

export function useTableNav(totalRows: number, totalCols: number) {
  const [activeCell, setActiveCell] = useState<CellAddress | null>(null);

  const moveTo = useCallback(
    (row: number, col: number) => {
      if (row < 0 || row >= totalRows) {
        setActiveCell(null);
        return;
      }
      setActiveCell({ row, col: ((col % totalCols) + totalCols) % totalCols });
    },
    [totalRows, totalCols],
  );

  const moveNext = useCallback(
    (row: number, col: number) => {
      if (col + 1 < totalCols) moveTo(row, col + 1);
      else if (row + 1 < totalRows) moveTo(row + 1, 0);
      else setActiveCell(null);
    },
    [moveTo, totalCols, totalRows],
  );

  const movePrev = useCallback(
    (row: number, col: number) => {
      if (col - 1 >= 0) moveTo(row, col - 1);
      else if (row > 0) moveTo(row - 1, totalCols - 1);
      else setActiveCell(null);
    },
    [moveTo, totalCols],
  );

  const moveDown = useCallback(
    (row: number, col: number) => {
      if (row + 1 < totalRows) moveTo(row + 1, col);
      else setActiveCell(null);
    },
    [moveTo, totalRows],
  );

  return { activeCell, setActiveCell, moveNext, movePrev, moveDown };
}
