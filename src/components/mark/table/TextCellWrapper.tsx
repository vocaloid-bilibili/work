import { useState } from "react";
import HintInput from "./HintInput";
import type { ColDef } from "./columns";

interface Props {
  record: any;
  rowInPage: number;
  colIdx: number;
  colDef: ColDef;
  onCommit: (row: number, col: ColDef, value: unknown) => void;
  onCancel: () => void;
  onMoveNext: (row: number, col: number) => void;
  onMovePrev: (row: number, col: number) => void;
  onMoveDown: (row: number, col: number) => void;
}

export default function TextCellWrapper({
  record,
  rowInPage,
  colIdx,
  colDef,
  onCommit,
  onCancel,
  onMoveNext,
  onMovePrev,
  onMoveDown,
}: Props) {
  const [localValue, setLocalValue] = useState(
    String(record[colDef.key] || ""),
  );
  const commit = (v: string) => onCommit(rowInPage, colDef, v);

  return (
    <HintInput
      value={localValue}
      onChange={setLocalValue}
      onCommit={() => {
        commit(localValue);
        onMoveDown(rowInPage, colIdx);
      }}
      onCancel={onCancel}
      onTab={() => {
        commit(localValue);
        onMoveNext(rowInPage, colIdx);
      }}
      onShiftTab={() => {
        commit(localValue);
        onMovePrev(rowInPage, colIdx);
      }}
      onArrowDown={() => {
        commit(localValue);
        onMoveDown(rowInPage, colIdx);
      }}
      searchType={colDef.searchType}
      autoFocus
    />
  );
}
