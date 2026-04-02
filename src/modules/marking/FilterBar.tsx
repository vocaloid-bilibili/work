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

const FILTER_CFG = {
  included: {
    Icon: CheckCircle2,
    label: "收录",
    hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
    active:
      "bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 shadow-sm",
    inactive: "border-emerald-300 text-emerald-700 dark:text-emerald-400",
  },
  blacklisted: {
    Icon: Ban,
    label: "排除",
    hoverBg: "hover:bg-red-50 dark:hover:bg-red-950/30",
    active:
      "bg-red-100 border-red-500 text-red-700 dark:bg-red-950/50 dark:text-red-300 shadow-sm",
    inactive: "border-red-300 text-red-700 dark:text-red-400",
  },
  pending: {
    Icon: CircleDot,
    label: "待处理",
    hoverBg: "hover:bg-amber-50 dark:hover:bg-amber-950/30",
    active:
      "bg-amber-100 border-amber-500 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 shadow-sm",
    inactive: "border-amber-300 text-amber-700 dark:text-amber-400",
  },
} as const;

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
  const counts: Record<string, number> = {
    included,
    blacklisted,
    pending,
  };

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
        {(Object.keys(FILTER_CFG) as (keyof typeof FILTER_CFG)[]).map((key) => {
          const cfg = FILTER_CFG[key];
          const count = counts[key];
          const isActive = filter === key;
          return (
            <Badge
              key={key}
              variant="outline"
              className={cn(
                "gap-1 cursor-pointer select-none tabular-nums transition-all active:scale-95",
                cfg.hoverBg,
                isActive ? cfg.active : cfg.inactive,
                filter && filter !== key && "opacity-40",
              )}
              onClick={() => tog(key)}
            >
              <cfg.Icon className="h-3 w-3" />
              {cfg.label} {count}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
