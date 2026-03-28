// src/modules/marking/FilterBar.tsx
import { Badge } from "@/ui/badge";
import { CheckCircle2, Ban, CircleDot, FilterX } from "lucide-react";
import { cn } from "@/ui/cn";
import SearchBar from "./SearchBar";
import type { Filter } from "./state/useMarkPaging";

interface P {
  total: number;
  included: number;
  blacklisted: number;
  pending: number;
  filter: Filter;
  filteredCount: number;
  onFilterChange: (f: Filter) => void;
  records: any[];
  includeEntries: boolean[];
  blacklistedEntries: boolean[];
  onJump: (i: number) => void;
}

export default function FilterBar({
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
}: P) {
  const tog = (k: Filter) => onFilterChange(filter === k ? null : k);
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pb-3 border-b">
      <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
        <SearchBar
          records={records}
          includes={includeEntries}
          blacklists={blacklistedEntries}
          onJump={onJump}
        />
        {filter && (
          <button
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md px-2 py-1 hover:bg-muted/60 shrink-0"
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
      <div className="flex flex-wrap gap-1.5 text-xs shrink-0">
        <Badge
          variant="secondary"
          className="gap-1 tabular-nums pointer-events-none"
        >
          共 {total} 条
        </Badge>
        {(
          [
            ["included", "emerald", CheckCircle2, "收录", included],
            ["blacklisted", "red", Ban, "排除", blacklisted],
            ["pending", "amber", CircleDot, "待处理", pending],
          ] as const
        ).map(([key, color, Icon, label, count]) => (
          <Badge
            key={key}
            variant="outline"
            className={cn(
              "gap-1 cursor-pointer select-none tabular-nums transition-all active:scale-95",
              `hover:bg-${color}-50 dark:hover:bg-${color}-950/30`,
              filter === key
                ? `bg-${color}-100 border-${color}-500 text-${color}-700 dark:bg-${color}-950/50 dark:text-${color}-300 shadow-sm`
                : `border-${color}-300 text-${color}-700 dark:text-${color}-400`,
              filter && filter !== key && "opacity-40",
            )}
            onClick={() => tog(key)}
          >
            <Icon className="h-3 w-3" />
            {label} {count}
          </Badge>
        ))}
      </div>
    </div>
  );
}
