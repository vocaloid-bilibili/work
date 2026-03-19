import { useState } from "react";
import HintInput from "./HintInput";
import type { ColDef } from "./columns";

interface Props {
  record: any;
  rowInPage: number;
  colIdx: number;
  colDef: ColDef;
  initialChar?: string;
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
  initialChar,
  onCommit,
  onCancel,
  onMoveNext,
  onMovePrev,
  onMoveDown,
}: Props) {
  const [localValue, setLocalValue] = useState(
    initialChar !== undefined ? initialChar : String(record[colDef.key] || ""),
  );

  const commit = (finalValue?: string) => {
    onCommit(rowInPage, colDef, finalValue ?? localValue);
  };

  return (
    <HintInput
      value={localValue}
      onChange={setLocalValue}
      onCommit={(selected) => {
        commit(selected);
        onMoveDown(rowInPage, colIdx);
      }}
      onCancel={onCancel}
      onTab={() => {
        commit();
        onMoveNext(rowInPage, colIdx);
      }}
      onShiftTab={() => {
        commit();
        onMovePrev(rowInPage, colIdx);
      }}
      onArrowDown={() => {
        commit();
        onMoveDown(rowInPage, colIdx);
      }}
      searchType={colDef.searchType}
      autoFocus
    />
  );
}
