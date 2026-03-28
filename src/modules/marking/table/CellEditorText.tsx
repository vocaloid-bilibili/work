// src/modules/marking/table/CellEditorText.tsx
import { useState } from "react";
import HintInput from "@/shared/ui/HintInput";
import type { ColDef } from "./columns";

interface P {
  record: any;
  row: number;
  col: number;
  colDef: ColDef;
  initialChar?: string;
  onCommit: (r: number, c: ColDef, v: unknown) => void;
  onCancel: () => void;
  onNext: (r: number, c: number) => void;
  onPrev: (r: number, c: number) => void;
  onDown: (r: number, c: number) => void;
}

export default function CellEditorText({
  record,
  row,
  col,
  colDef,
  initialChar,
  onCommit,
  onCancel,
  onNext,
  onPrev,
  onDown,
}: P) {
  const [val, setVal] = useState(
    initialChar !== undefined ? initialChar : String(record[colDef.key] || ""),
  );
  const commit = (fv?: string) => onCommit(row, colDef, fv ?? val);

  return (
    <HintInput
      value={val}
      onChange={setVal}
      onCommit={(sel) => {
        commit(sel);
        onDown(row, col);
      }}
      onCancel={onCancel}
      onTab={() => {
        commit();
        onNext(row, col);
      }}
      onShiftTab={() => {
        commit();
        onPrev(row, col);
      }}
      onArrowDown={() => {
        commit();
        onDown(row, col);
      }}
      searchType={colDef.searchType}
      autoFocus
    />
  );
}
