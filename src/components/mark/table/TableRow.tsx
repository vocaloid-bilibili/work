import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, Ban, Undo2, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { COLUMNS, type ColDef } from "./columns";
import CellRenderer from "./CellRenderer";
import type { CellAddress } from "./useTableNav";

interface Props {
  record: any;
  rowInPage: number;
  pageOffset: number;
  isIncluded: boolean;
  isBlacklisted: boolean;
  activeCell: CellAddress | null;
  onIncludeChange: (i: number, v: boolean) => void;
  onBlacklist: (i: number) => void;
  onUnblacklist: (i: number) => void;
  commitField: (row: number, col: ColDef, value: unknown) => void;
  setActiveCell: (c: CellAddress | null) => void;
  moveNext: (r: number, c: number) => void;
  movePrev: (r: number, c: number) => void;
  moveDown: (r: number, c: number) => void;
}

export default function TableRowComp({
  record,
  rowInPage,
  pageOffset,
  isIncluded,
  isBlacklisted,
  activeCell,
  onIncludeChange,
  onBlacklist,
  onUnblacklist,
  commitField,
  setActiveCell,
  moveNext,
  movePrev,
  moveDown,
}: Props) {
  const realIndex = pageOffset + rowInPage;
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(realIndex);

  return (
    <tr
      id={`record-${realIndex}`}
      className={cn(
        "border-b transition-colors group scroll-mt-16",
        isBlacklisted
          ? "bg-red-50/50 dark:bg-red-950/15 text-muted-foreground"
          : isIncluded
            ? "hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10"
            : "hover:bg-muted/30",
        activeCell?.row === rowInPage && "bg-primary/5",
      )}
    >
      <td className="px-2 py-1.5 text-center text-[11px] text-muted-foreground border-r tabular-nums">
        {realIndex + 1}
      </td>
      <td className="px-1 py-1 border-r">
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
                onClick={() => onIncludeChange(realIndex, !isIncluded)}
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
                  isBlacklisted ? "text-red-500" : "text-muted-foreground/40",
                )}
                onClick={() =>
                  isBlacklisted
                    ? onUnblacklist(realIndex)
                    : onBlacklist(realIndex)
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
              {isBlacklisted ? "取消排除" : "排除"}
            </TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6",
              bookmarked
                ? "text-primary"
                : "text-muted-foreground/40 opacity-0 group-hover:opacity-100",
            )}
            onClick={() => toggleBookmark(realIndex, record.title)}
          >
            <Bookmark
              className={cn("h-3.5 w-3.5", bookmarked && "fill-primary")}
            />
          </Button>
        </div>
      </td>
      <td className="px-2 py-1.5 border-r">
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
      {COLUMNS.map((colDef, colIdx) => {
        const isActive =
          activeCell?.row === rowInPage && activeCell?.col === colIdx;
        return (
          <td
            key={colDef.key}
            className={cn(
              "px-1.5 py-1 border-r last:border-r-0 relative cursor-pointer transition-colors",
              colDef.width,
              isActive && "ring-2 ring-inset ring-primary/60 bg-primary/5",
              !isActive && "hover:bg-muted/40",
              isBlacklisted && "pointer-events-none opacity-40",
            )}
            onClick={() => {
              if (!isBlacklisted)
                setActiveCell({ row: rowInPage, col: colIdx });
            }}
          >
            <CellRenderer
              record={record}
              rowInPage={rowInPage}
              colIdx={colIdx}
              colDef={colDef}
              isActive={isActive}
              isIncluded={isIncluded}
              isBlacklisted={isBlacklisted}
              commitField={commitField}
              clearActive={() => setActiveCell(null)}
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
