import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { COPYRIGHT_LABELS, REQ_FIELDS, type ColDef } from "./columns";
import TagCellEditor from "./TagCellEditor";
import SelectCellEditor from "./SelectCellEditor";
import TextCellWrapper from "./TextCellWrapper";

interface Props {
  record: any;
  rowInPage: number;
  colIdx: number;
  colDef: ColDef;
  isActive: boolean;
  isIncluded: boolean;
  isBlacklisted: boolean;
  commitField: (row: number, col: ColDef, value: unknown) => void;
  clearActive: () => void;
  moveNext: (r: number, c: number) => void;
  movePrev: (r: number, c: number) => void;
  moveDown: (r: number, c: number) => void;
}

export default function CellRenderer({
  record,
  rowInPage,
  colIdx,
  colDef,
  isActive,
  isIncluded,
  isBlacklisted,
  commitField,
  clearActive,
  moveNext,
  movePrev,
  moveDown,
}: Props) {
  const val = record[colDef.key];
  const empty = val === undefined || val === null || String(val).trim() === "";
  const hasErr =
    isIncluded && !isBlacklisted && REQ_FIELDS.includes(colDef.key) && empty;

  if (isActive && !isBlacklisted) {
    if (colDef.type === "text")
      return (
        <TextCellWrapper
          record={record}
          rowInPage={rowInPage}
          colIdx={colIdx}
          colDef={colDef}
          onCommit={commitField}
          onCancel={clearActive}
          onMoveNext={moveNext}
          onMovePrev={movePrev}
          onMoveDown={moveDown}
        />
      );
    if (colDef.type === "tags")
      return (
        <TagCellEditor
          value={String(val || "")}
          searchType={colDef.searchType}
          onCommit={(v) => {
            commitField(rowInPage, colDef, v);
            clearActive();
          }}
          onCancel={clearActive}
          onTab={(v) => {
            commitField(rowInPage, colDef, v);
            moveNext(rowInPage, colIdx);
          }}
          onShiftTab={(v) => {
            commitField(rowInPage, colDef, v);
            movePrev(rowInPage, colIdx);
          }}
          onMoveDown={(v) => {
            commitField(rowInPage, colDef, v);
            moveDown(rowInPage, colIdx);
          }}
        />
      );
    if (colDef.type === "select")
      return (
        <SelectCellEditor
          value={val}
          options={colDef.options || []}
          onCommit={(v) => {
            commitField(rowInPage, colDef, v);
            moveDown(rowInPage, colIdx);
          }}
          onCancel={clearActive}
          onTab={(v) => {
            commitField(rowInPage, colDef, v);
            moveNext(rowInPage, colIdx);
          }}
          onShiftTab={(v) => {
            commitField(rowInPage, colDef, v);
            movePrev(rowInPage, colIdx);
          }}
        />
      );
  }

  if (colDef.type === "select") {
    const label =
      colDef.key === "copyright"
        ? COPYRIGHT_LABELS[Number(val)] || String(val || "—")
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
