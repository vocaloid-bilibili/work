import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, Ban, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLUMNS, type ColDef } from "./columns";
import CellRenderer from "./CellRenderer";
import type { CellAddress } from "./useTableNav";

interface Props {
  record: any;
  rowInPage: number;
  pageOffset: number;
  isIncluded: boolean;
  isBlacklisted: boolean;
  isSelected: boolean;
  activeCell: CellAddress | null;
  isEditing: boolean;
  initialChar?: string;
  onIncludeChange: (i: number, v: boolean) => void;
  onBlacklist: (i: number) => void;
  onUnblacklist: (i: number) => void;
  commitField: (row: number, col: ColDef, value: unknown) => void;
  onCellSelect: (row: number, col: number) => void;
  onCellEdit: () => void;
  stopEditing: () => void;
  clearActive: () => void;
  moveNext: (r: number, c: number) => void;
  movePrev: (r: number, c: number) => void;
  moveDown: (r: number, c: number) => void;
  getWidth: (key: string) => number;
  onRowClick: (row: number, e: React.MouseEvent) => void;
  onRowDragStart: (row: number) => void;
  onRowDragEnter: (row: number) => void;
}

export default function TableRowComp({
  record,
  rowInPage,
  pageOffset,
  isIncluded,
  isBlacklisted,
  isSelected,
  activeCell,
  isEditing,
  initialChar,
  onIncludeChange,
  onBlacklist,
  onUnblacklist,
  commitField,
  onCellSelect,
  onCellEdit,
  stopEditing,
  clearActive,
  moveNext,
  movePrev,
  moveDown,
  getWidth,
  onRowClick,
  onRowDragStart,
  onRowDragEnter,
}: Props) {
  const ri = pageOffset + rowInPage;
  const canBlacklist = !isBlacklisted && !isIncluded;

  return (
    <tr
      id={`record-${ri}`}
      className={cn(
        "border-b transition-colors group scroll-mt-16",
        isSelected && "bg-primary/10! dark:bg-primary/15!",
        isBlacklisted
          ? "bg-red-50/50 dark:bg-red-950/15 text-muted-foreground"
          : isIncluded
            ? "hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10"
            : "hover:bg-muted/30",
        activeCell?.row === rowInPage && !isSelected && "bg-primary/5",
      )}
    >
      <td
        style={{ width: getWidth("_num") }}
        className={cn(
          "px-2 py-1.5 text-center text-[11px] border-r tabular-nums cursor-pointer select-none transition-colors",
          isSelected
            ? "bg-primary/20 text-primary font-bold"
            : "text-muted-foreground hover:bg-muted/60",
        )}
        onClick={(e) => onRowClick(rowInPage, e)}
        onMouseDown={() => onRowDragStart(rowInPage)}
        onMouseEnter={() => onRowDragEnter(rowInPage)}
      >
        {ri + 1}
      </td>

      {/* 操作列 */}
      <td style={{ width: getWidth("_ops") }} className="px-1 py-1 border-r">
        <div className="flex items-center justify-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6",
                  isIncluded && !isBlacklisted
                    ? "text-emerald-600"
                    : "text-muted-foreground/40",
                )}
                disabled={isBlacklisted}
                onClick={() => onIncludeChange(ri, !isIncluded)}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {isBlacklisted
                ? "请先取消排除"
                : isIncluded
                  ? "取消收录"
                  : "收录"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6",
                  isBlacklisted
                    ? "text-red-500"
                    : canBlacklist
                      ? "text-muted-foreground/40"
                      : "text-muted-foreground/20 cursor-not-allowed",
                )}
                disabled={!isBlacklisted && !canBlacklist}
                onClick={() =>
                  isBlacklisted ? onUnblacklist(ri) : onBlacklist(ri)
                }
              >
                {isBlacklisted ? (
                  <Undo2 className="h-3.5 w-3.5" />
                ) : (
                  <Ban className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {isBlacklisted
                ? "取消排除"
                : !canBlacklist
                  ? "请先取消收录再排除"
                  : "排除"}
            </TooltipContent>
          </Tooltip>
        </div>
      </td>

      {/* 标题列 */}
      <td
        style={{ width: getWidth("_title") }}
        className="px-2 py-1.5 border-r"
      >
        <div className="flex items-center gap-2 min-w-0">
          {record.image_url && (
            <img
              src={record.image_url}
              alt=""
              className={cn(
                "w-10 h-7 object-cover rounded shrink-0",
                isBlacklisted && "opacity-30 grayscale",
              )}
              referrerPolicy="no-referrer"
            />
          )}
          <a
            href={`https://www.bilibili.com/video/${record.bvid || "av" + record.aid}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs truncate hover:underline text-foreground/80 min-w-0"
            title={record.title}
          >
            {record.title}
          </a>
        </div>
      </td>
      {COLUMNS.map((col, ci) => {
        const active = activeCell?.row === rowInPage && activeCell?.col === ci;
        const editing = active && isEditing;

        return (
          <td
            key={col.key}
            style={{ width: getWidth(col.key) }}
            className={cn(
              "px-1.5 py-1 border-r last:border-r-0 relative cursor-cell transition-colors",
              active && "ring-2 ring-inset ring-primary/60",
              active && !editing && "bg-primary/5",
              editing && "bg-primary/10",
              !active && "hover:bg-muted/40",
              isBlacklisted && "pointer-events-none opacity-40",
            )}
            onClick={(e) => {
              if (isBlacklisted) return;
              e.stopPropagation();
              if (active && !editing) {
                onCellEdit();
              } else if (!active) {
                onCellSelect(rowInPage, ci);
              }
            }}
            onDoubleClick={(e) => {
              if (isBlacklisted) return;
              e.stopPropagation();
              onCellSelect(rowInPage, ci);
              setTimeout(() => onCellEdit(), 0);
            }}
          >
            <CellRenderer
              record={record}
              rowInPage={rowInPage}
              colIdx={ci}
              colDef={col}
              isActive={active}
              isEditing={editing}
              isIncluded={isIncluded}
              isBlacklisted={isBlacklisted}
              initialChar={editing ? initialChar : undefined}
              commitField={commitField}
              clearActive={clearActive}
              stopEditing={stopEditing}
              moveNext={moveNext}
              movePrev={movePrev}
              moveDown={moveDown}
            />
          </td>
        );
      })}
    </tr>
  );
}
