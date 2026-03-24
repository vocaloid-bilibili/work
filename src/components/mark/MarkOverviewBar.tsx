// src/components/mark/MarkOverviewBar.tsx

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Ban, CircleDot, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";
import MarkSearchBar from "./MarkSearchBar";

export type MarkFilter = "included" | "blacklisted" | "pending" | null;

interface Props {
  total: number;
  included: number;
  blacklisted: number;
  pending: number;
  filter: MarkFilter;
  filteredCount: number;
  onFilterChange: (filter: MarkFilter) => void;
  // 搜索跳转
  records: Array<Record<string, unknown>>;
  includeEntries: boolean[];
  blacklistedEntries: boolean[];
  onJump: (index: number) => void;
}

export default function MarkOverviewBar({
  total,
  included,
  blacklisted,
  pending,
  filter,
  filteredCount,
  onFilterChange,
  records,
  includeEntries,
  blacklistedEntries,
  onJump,
}: Props) {
  const toggle = (key: MarkFilter) => {
    onFilterChange(filter === key ? null : key);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pb-3 border-b">
      {/* 左侧：搜索 + 筛选状态 */}
      <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
        <MarkSearchBar
          records={records}
          includeEntries={includeEntries}
          blacklistedEntries={blacklistedEntries}
          onJump={onJump}
        />

        {filter && (
          <button
            className="flex items-center gap-1.5 text-xs text-muted-foreground
                       hover:text-foreground active:text-foreground
                       transition-colors rounded-md px-2 py-1
                       hover:bg-muted/60 active:bg-muted/80 shrink-0"
            onClick={() => onFilterChange(null)}
          >
            <FilterX className="h-3.5 w-3.5" />
            <span>
              显示 <strong className="text-foreground">{filteredCount}</strong>{" "}
              / {total} 条
            </span>
          </button>
        )}
      </div>

      {/* 右侧：筛选 badge */}
      <div className="flex flex-wrap gap-1.5 text-xs shrink-0">
        <Badge
          variant="secondary"
          className="gap-1 tabular-nums pointer-events-none"
        >
          共 {total} 条
        </Badge>

        <Badge
          variant="outline"
          className={cn(
            "gap-1 cursor-pointer select-none tabular-nums transition-all",
            "hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-95",
            filter === "included"
              ? "bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30"
              : "border-emerald-300 text-emerald-700 dark:text-emerald-400",
            filter && filter !== "included" && "opacity-40",
          )}
          onClick={() => toggle("included")}
        >
          <CheckCircle2 className="h-3 w-3" />
          收录 {included}
        </Badge>

        <Badge
          variant="outline"
          className={cn(
            "gap-1 cursor-pointer select-none tabular-nums transition-all",
            "hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-95",
            filter === "blacklisted"
              ? "bg-red-100 border-red-500 text-red-600 dark:bg-red-950/50 dark:text-red-300 dark:border-red-500 shadow-sm shadow-red-200 dark:shadow-red-900/30"
              : "border-red-300 text-red-600 dark:text-red-400",
            filter && filter !== "blacklisted" && "opacity-40",
          )}
          onClick={() => toggle("blacklisted")}
        >
          <Ban className="h-3 w-3" />
          排除 {blacklisted}
        </Badge>

        <Badge
          variant="outline"
          className={cn(
            "gap-1 cursor-pointer select-none tabular-nums transition-all",
            "hover:bg-amber-50 dark:hover:bg-amber-950/30 active:scale-95",
            filter === "pending"
              ? "bg-amber-100 border-amber-500 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-500 shadow-sm shadow-amber-200 dark:shadow-amber-900/30"
              : "border-amber-300/60 text-muted-foreground",
            filter && filter !== "pending" && "opacity-40",
          )}
          onClick={() => toggle("pending")}
        >
          <CircleDot className="h-3 w-3" />
          待处理 {pending}
        </Badge>
      </div>
    </div>
  );
}
