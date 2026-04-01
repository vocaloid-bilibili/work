// src/modules/stats/Timeline.tsx
import { Button } from "@/ui/button";
import { Loader2, CircleCheckBig, Ban, Undo2, Pencil } from "lucide-react";
import Avatar from "@/shared/ui/Avatar";
import { cn } from "@/ui/cn";
import { Empty } from "./statsAtoms";
import type { LogEntry } from "@/core/types/stats";
import { FIELD_LABELS } from "@/core/types/constants";
const ACTION: Record<
  string,
  {
    label: string;
    Icon: typeof CircleCheckBig;
    border: string;
    badge: string;
  }
> = {
  toggle_include: {
    label: "收录",
    Icon: CircleCheckBig,
    border: "border-l-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  blacklist: {
    label: "排除",
    Icon: Ban,
    border: "border-l-red-400 dark:border-l-red-500",
    badge: "bg-red-500/10 text-red-500 dark:text-red-400",
  },
  unblacklist: {
    label: "取消排除",
    Icon: Undo2,
    border: "border-l-amber-400 dark:border-l-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  set: {
    label: "编辑",
    Icon: Pencil,
    border: "border-l-blue-400 dark:border-l-blue-500",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
};

interface P {
  ops: LogEntry[];
  total: number;
  hasMore: boolean;
  loading?: boolean;
  onLoadMore?: () => void;
}

export default function Timeline({
  ops,
  total,
  hasMore,
  loading,
  onLoadMore,
}: P) {
  if (!ops.length && !loading) return <Empty text="暂无操作记录" />;

  const groups: { date: string; items: LogEntry[] }[] = [];
  for (const op of ops) {
    const d = op.at?.slice(0, 10) || "未知";
    const last = groups[groups.length - 1];
    if (last?.date === d) last.items.push(op);
    else groups.push({ date: d, items: [op] });
  }

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <div key={g.date}>
          <div className="flex items-center gap-3 mb-4 sticky top-14 bg-background/90 backdrop-blur py-2 z-10">
            <span className="text-sm font-bold">{g.date}</span>
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5 tabular-nums font-medium">
              {g.items.length} 条操作
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-2">
            {g.items.map((op) => {
              const a = ACTION[op.action] || ACTION.set;
              const ActionIcon = a.Icon;
              const field =
                op.action === "set" && op.field
                  ? FIELD_LABELS[op.field] || op.field
                  : null;

              return (
                <div
                  key={op.opId}
                  className={cn(
                    "rounded-xl border border-l-[3px] px-4 py-3.5 transition-colors hover:bg-muted/20",
                    a.border,
                  )}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <Avatar
                      src={op.user?.avatar}
                      name={op.user?.nickname || op.user?.username || "?"}
                      size="sm"
                    />
                    <span className="text-sm font-semibold truncate">
                      {op.user?.nickname || op.user?.username || "未知"}
                    </span>
                    <div className="flex items-center gap-1.5 ml-auto shrink-0">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md",
                          a.badge,
                        )}
                      >
                        <ActionIcon className="h-3 w-3" />
                        {a.label}
                      </span>
                      {field && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          {field}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground/60 tabular-nums ml-1">
                        {op.at?.slice(11, 16)}
                      </span>
                    </div>
                  </div>

                  <div className="pl-9 space-y-1.5">
                    <p className="text-sm leading-relaxed line-clamp-3">
                      <span className="text-muted-foreground/50 font-mono text-xs mr-1.5">
                        #{op.recordIndex + 1}
                      </span>
                      <span className="text-foreground/80">
                        {op.recordTitle || ""}
                      </span>
                    </p>
                    {op.value != null && op.action === "set" && (
                      <div className="flex items-start gap-2 text-sm rounded-lg bg-muted/40 px-3 py-2">
                        <span className="text-muted-foreground/60 shrink-0 mt-px">
                          →
                        </span>
                        <span className="font-medium text-foreground/80 break-all line-clamp-2">
                          {String(op.value)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {loading && (
        <div className="py-6 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
        </div>
      )}

      {hasMore && onLoadMore && !loading && (
        <div className="text-center pt-2">
          <Button variant="outline" size="sm" onClick={onLoadMore}>
            加载更多（已加载 {ops.length} / 共 {total}）
          </Button>
        </div>
      )}

      {!hasMore && ops.length > 0 && (
        <p className="text-center text-xs text-muted-foreground/50 pt-2">
          共 {total} 条
        </p>
      )}
    </div>
  );
}
