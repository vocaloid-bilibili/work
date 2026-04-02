// src/modules/marking/table/MarkTableRow.tsx
import { memo } from "react";
import { Button } from "@/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";
import { CheckCircle2, Ban, Undo2 } from "lucide-react";
import { cn } from "@/ui/cn";
import { COLUMNS, type ColDef } from "./columns";
import CellRenderer from "./CellRenderer";
import CachedImg from "@/shared/ui/CachedImg";

interface P {
  record: any;
  row: number;
  realIndex: number;
  isIncluded: boolean;
  isBlacklisted: boolean;
  isSelected: boolean;
  isActiveRow: boolean;
  activeCol: number | null;
  isEditing: boolean;
  initialChar?: string;
  highlight?: boolean;
  onInclude: (i: number, v: boolean) => void;
  onBlacklist: (i: number) => void;
  onUnblacklist: (i: number) => void;
  commitField: (r: number, c: ColDef, v: unknown) => void;
  onCellSelect: (r: number, c: number) => void;
  onCellEdit: () => void;
  stopEditing: () => void;
  clearActive: () => void;
  next: (r: number, c: number) => void;
  prev: (r: number, c: number) => void;
  down: (r: number, c: number) => void;
  getW: (k: string) => number;
  onRowClick: (r: number, e: React.MouseEvent) => void;
  onDragStart: (r: number) => void;
  onDragEnter: (r: number) => void;
}

function RowInner(p: P) {
  const ri = p.realIndex;
  const canBl = !p.isBlacklisted && !p.isIncluded;

  return (
    <tr
      id={`record-${ri}`}
      className={cn(
        "border-b transition-colors group scroll-mt-16",
        p.isSelected && "bg-primary/10! dark:bg-primary/15!",
        p.isBlacklisted
          ? "bg-red-50/50 dark:bg-red-950/15 text-muted-foreground"
          : p.isIncluded
            ? "hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10"
            : "hover:bg-muted/30",
        p.isActiveRow && !p.isSelected && "bg-primary/5",
        p.highlight && "ring-2 ring-primary ring-offset-2",
      )}
    >
      <td
        style={{ width: p.getW("_num") }}
        className={cn(
          "px-2 py-1.5 text-center text-[11px] border-r tabular-nums cursor-pointer select-none transition-colors",
          p.isSelected
            ? "bg-primary/20 text-primary font-bold"
            : "text-muted-foreground hover:bg-muted/60",
        )}
        onClick={(e) => p.onRowClick(p.row, e)}
        onMouseDown={() => p.onDragStart(p.row)}
        onMouseEnter={() => p.onDragEnter(p.row)}
      >
        {ri + 1}
      </td>
      <td style={{ width: p.getW("_ops") }} className="px-1 py-1 border-r">
        <div className="flex items-center justify-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6",
                  p.isIncluded && !p.isBlacklisted
                    ? "text-emerald-600"
                    : "text-muted-foreground/40",
                )}
                disabled={p.isBlacklisted}
                onClick={() => p.onInclude(ri, !p.isIncluded)}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {p.isBlacklisted
                ? "请先取消排除"
                : p.isIncluded
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
                  p.isBlacklisted
                    ? "text-red-500"
                    : canBl
                      ? "text-muted-foreground/40"
                      : "text-muted-foreground/20 cursor-not-allowed",
                )}
                disabled={!p.isBlacklisted && !canBl}
                onClick={() =>
                  p.isBlacklisted ? p.onUnblacklist(ri) : p.onBlacklist(ri)
                }
              >
                {p.isBlacklisted ? (
                  <Undo2 className="h-3.5 w-3.5" />
                ) : (
                  <Ban className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {p.isBlacklisted ? "取消排除" : !canBl ? "请先取消收录" : "排除"}
            </TooltipContent>
          </Tooltip>
        </div>
      </td>
      <td style={{ width: p.getW("_title") }} className="px-2 py-1.5 border-r">
        <div className="flex items-center gap-2 min-w-0">
          {p.record.image_url && (
            <CachedImg
              src={p.record.image_url}
              alt=""
              className={cn(
                "w-10 h-7 object-cover rounded shrink-0",
                p.isBlacklisted && "opacity-30 grayscale",
              )}
            />
          )}
          <a
            href={`https://www.bilibili.com/video/${p.record.bvid || "av" + p.record.aid}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs truncate hover:underline text-foreground/80 min-w-0"
            title={p.record.title}
          >
            {p.record.title}
          </a>
        </div>
      </td>
      {COLUMNS.map((col, ci) => {
        const active = p.isActiveRow && p.activeCol === ci;
        const editing = active && p.isEditing;
        return (
          <td
            key={col.key}
            style={{ width: p.getW(col.key) }}
            className={cn(
              "px-1.5 py-1 border-r last:border-r-0 relative cursor-cell transition-colors",
              active && "ring-2 ring-inset ring-primary/60",
              active && !editing && "bg-primary/5",
              editing && "bg-primary/10",
              !active && "hover:bg-muted/40",
              p.isBlacklisted && "pointer-events-none opacity-40",
            )}
            onClick={(e) => {
              if (p.isBlacklisted) return;
              e.stopPropagation();
              if (active && !editing) p.onCellEdit();
              else if (!active) p.onCellSelect(p.row, ci);
            }}
            onDoubleClick={(e) => {
              if (p.isBlacklisted) return;
              e.stopPropagation();
              p.onCellSelect(p.row, ci);
              setTimeout(p.onCellEdit, 0);
            }}
          >
            <CellRenderer
              record={p.record}
              row={p.row}
              col={ci}
              colDef={col}
              isActive={active}
              isEditing={editing}
              isIncluded={p.isIncluded}
              isBlacklisted={p.isBlacklisted}
              initialChar={editing ? p.initialChar : undefined}
              commitField={p.commitField}
              stopEditing={p.stopEditing}
              next={p.next}
              prev={p.prev}
              down={p.down}
            />
          </td>
        );
      })}
    </tr>
  );
}

export default memo(RowInner, (a, b) => {
  if (
    a.record !== b.record ||
    a.isIncluded !== b.isIncluded ||
    a.isBlacklisted !== b.isBlacklisted ||
    a.isSelected !== b.isSelected
  )
    return false;
  if (a.isActiveRow !== b.isActiveRow) return false;
  if (a.isActiveRow || b.isActiveRow) {
    if (
      a.activeCol !== b.activeCol ||
      a.isEditing !== b.isEditing ||
      a.initialChar !== b.initialChar
    )
      return false;
  }
  if (
    a.row !== b.row ||
    a.realIndex !== b.realIndex ||
    a.getW !== b.getW ||
    a.highlight !== b.highlight
  )
    return false;
  return true;
});
