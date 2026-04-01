// src/modules/marking/table/CellRenderer.tsx
import { Badge } from "@/ui/badge";
import { cn } from "@/ui/cn";
import { COPYRIGHT_MAP, REQ_FIELDS, type ColDef } from "./columns";
import CellEditorTags from "./CellEditorTags";
import CellEditorSelect from "./CellEditorSelect";
import CellEditorText from "./CellEditorText";

interface P {
  record: any;
  row: number;
  col: number;
  colDef: ColDef;
  isActive: boolean;
  isEditing: boolean;
  isIncluded: boolean;
  isBlacklisted: boolean;
  initialChar?: string;
  commitField: (r: number, c: ColDef, v: unknown) => void;
  stopEditing: () => void;
  next: (r: number, c: number) => void;
  prev: (r: number, c: number) => void;
  down: (r: number, c: number) => void;
}

export default function CellRenderer({
  record,
  row,
  col,
  colDef,
  isActive,
  isEditing,
  isIncluded,
  isBlacklisted,
  initialChar,
  commitField,
  stopEditing,
  next,
  prev,
  down,
}: P) {
  const val = record[colDef.key];
  const empty = val == null || String(val).trim() === "";
  const hasErr =
    isIncluded && !isBlacklisted && REQ_FIELDS.includes(colDef.key) && empty;

  if (isActive && isEditing && !isBlacklisted) {
    if (colDef.type === "text")
      return (
        <CellEditorText
          record={record}
          row={row}
          col={col}
          colDef={colDef}
          initialChar={initialChar}
          onCommit={commitField}
          onCancel={stopEditing}
          onNext={next}
          onPrev={prev}
          onDown={down}
        />
      );
    if (colDef.type === "tags")
      return (
        <CellEditorTags
          value={String(val || "")}
          searchType={colDef.searchType}
          initialChar={initialChar}
          onCommit={(v) => {
            commitField(row, colDef, v);
            stopEditing();
          }}
          onCancel={stopEditing}
          onTab={(v) => {
            commitField(row, colDef, v);
            next(row, col);
          }}
          onShiftTab={(v) => {
            commitField(row, colDef, v);
            prev(row, col);
          }}
          onDown={(v) => {
            commitField(row, colDef, v);
            down(row, col);
          }}
        />
      );
    if (colDef.type === "select")
      return (
        <CellEditorSelect
          value={val}
          options={colDef.options || []}
          onCommit={(v) => {
            commitField(row, colDef, v);
            down(row, col);
          }}
          onCancel={stopEditing}
          onTab={(v) => {
            commitField(row, colDef, v);
            next(row, col);
          }}
          onShiftTab={(v) => {
            commitField(row, colDef, v);
            prev(row, col);
          }}
        />
      );
  }

  if (colDef.type === "select") {
    const label =
      colDef.key === "copyright"
        ? COPYRIGHT_MAP[Number(val)] || String(val || "—")
        : val || "—";
    return (
      <span className={cn("text-xs", hasErr && "text-destructive")}>
        {label}
      </span>
    );
  }
  if (colDef.type === "tags") {
    if (empty)
      return (
        <span
          className={cn(
            "text-xs text-muted-foreground italic",
            hasErr && "text-destructive",
          )}
        >
          —
        </span>
      );
    return (
      <div className="flex flex-wrap gap-0.5">
        {String(val)
          .split("、")
          .filter(Boolean)
          .map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="text-[10px] h-4.5 px-1 font-normal"
            >
              {t}
            </Badge>
          ))}
      </div>
    );
  }
  return (
    <span
      className={cn(
        "text-xs truncate block",
        hasErr && "text-destructive",
        empty && "italic text-muted-foreground",
      )}
    >
      {val || "—"}
    </span>
  );
}
