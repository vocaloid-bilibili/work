import { useState, useCallback } from "react";

export type CellAddress = { row: number; col: number };

export function useTableNav(totalRows: number, totalCols: number) {
  const [activeCell, setActiveCell] = useState<CellAddress | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const selectCell = useCallback(
    (row: number, col: number) => {
      if (row < 0 || row >= totalRows) {
        setActiveCell(null);
        setIsEditing(false);
        return;
      }
      const c = ((col % totalCols) + totalCols) % totalCols;
      setActiveCell((prev) => {
        if (prev?.row === row && prev?.col === c) return prev;
        setIsEditing(false);
        return { row, col: c };
      });
    },
    [totalRows, totalCols],
  );

  const clearActive = useCallback(() => {
    setActiveCell(null);
    setIsEditing(false);
  }, []);

  const startEditing = useCallback(() => setIsEditing(true), []);
  const stopEditing = useCallback(() => setIsEditing(false), []);

  const moveNext = useCallback(
    (row: number, col: number) => {
      if (col + 1 < totalCols) selectCell(row, col + 1);
      else if (row + 1 < totalRows) selectCell(row + 1, 0);
      else {
        setActiveCell(null);
        setIsEditing(false);
      }
    },
    [selectCell, totalCols, totalRows],
  );

  const movePrev = useCallback(
    (row: number, col: number) => {
      if (col - 1 >= 0) selectCell(row, col - 1);
      else if (row > 0) selectCell(row - 1, totalCols - 1);
      else {
        setActiveCell(null);
        setIsEditing(false);
      }
    },
    [selectCell, totalCols],
  );

  const moveDown = useCallback(
    (row: number, col: number) => {
      if (row + 1 < totalRows) selectCell(row + 1, col);
      else {
        setActiveCell(null);
        setIsEditing(false);
      }
    },
    [selectCell, totalRows],
  );

  const moveUp = useCallback(
    (row: number, col: number) => {
      if (row - 1 >= 0) selectCell(row - 1, col);
    },
    [selectCell],
  );

  return {
    activeCell,
    setActiveCell: selectCell,
    clearActive,
    isEditing,
    startEditing,
    stopEditing,
    moveNext,
    movePrev,
    moveDown,
    moveUp,
  };
}
