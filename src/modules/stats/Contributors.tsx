// src/modules/stats/Contributors.tsx
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Avatar from "@/shared/ui/Avatar";
import { cn } from "@/ui/cn";
import { getAction } from "./actions";
import type { ContributorStats } from "@/core/types/stats";

interface P {
  list: ContributorStats[];
  currentUsername?: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function Contributors({
  list,
  currentUsername,
  selectedId,
  onSelect,
}: P) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!list.length) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6">
        暂无贡献者
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {list.map((c, i) => {
        const active = selectedId === c.user.id;
        const isMe = !!currentUsername && c.user.username === currentUsername;
        const expanded = expandedId === c.user.id;

        const actionEntries = Object.entries(c.actions)
          .filter(([, v]) => v.count > 0)
          .sort(([, a], [, b]) => b.score - a.score);

        return (
          <div
            key={c.user.id}
            className={cn(
              "rounded-lg transition-all overflow-hidden",
              active
                ? "bg-foreground/5 ring-1 ring-foreground/10"
                : "hover:bg-muted/60",
              isMe && !active && "bg-amber-50 dark:bg-amber-950/20",
            )}
          >
            <div className="flex items-center gap-2.5 px-2.5 py-2">
              <span className="w-5 text-center text-xs font-bold tabular-nums text-muted-foreground/40 shrink-0">
                {i + 1}
              </span>

              <button
                onClick={() => onSelect(c.user.id)}
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
              >
                <Avatar
                  src={c.user.avatar}
                  name={c.user.nickname || c.user.username || "?"}
                  size="sm"
                />

                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold truncate block">
                    {c.user.nickname || c.user.username || "匿名"}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {c.totalOps} 操作
                  </span>
                </div>
              </button>

              <span className="text-sm font-extrabold tabular-nums text-amber-600 dark:text-amber-400 shrink-0">
                {c.score}
              </span>

              {actionEntries.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(expanded ? null : c.user.id);
                  }}
                  className="p-1 rounded hover:bg-muted transition-colors shrink-0"
                >
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200",
                      expanded && "rotate-180",
                    )}
                  />
                </button>
              )}
            </div>

            <Collapse open={expanded}>
              <div className="pb-2.5 pl-10 pr-2.5">
                <div className="rounded-lg bg-muted/20 divide-y divide-border/30">
                  {actionEntries.map(([actionKey, { count, score }]) => {
                    const def = getAction(actionKey);
                    const ActionIcon = def.Icon;
                    return (
                      <div
                        key={actionKey}
                        className="flex items-center gap-2 px-3 py-1.5"
                      >
                        <ActionIcon
                          className={cn("h-3 w-3 shrink-0", def.color)}
                        />
                        <span className="text-[11px] text-muted-foreground flex-1 truncate">
                          {def.label}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-bold tabular-nums",
                            def.color,
                          )}
                        >
                          {count}
                        </span>
                        {score > 0 && (
                          <span className="text-[10px] text-muted-foreground/50 tabular-nums w-10 text-right">
                            +{score}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {c.taskCount != null && c.taskCount > 1 && (
                  <div className="text-[10px] text-muted-foreground/50 mt-1.5 pl-1 tabular-nums">
                    参与 {c.taskCount} 个任务
                  </div>
                )}
              </div>
            </Collapse>
          </div>
        );
      })}
    </div>
  );
}

function Collapse({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) setHeight(ref.current.scrollHeight);
  }, [open, children]);

  return (
    <div
      className="overflow-hidden transition-[max-height,opacity] duration-200 ease-out"
      style={{
        maxHeight: open ? height : 0,
        opacity: open ? 1 : 0,
      }}
    >
      <div ref={ref}>{children}</div>
    </div>
  );
}
