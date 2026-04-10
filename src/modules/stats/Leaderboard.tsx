// src/modules/stats/Leaderboard.tsx
import { useRef } from "react";
import { CircleCheckBig, Ban, Pencil, Wrench } from "lucide-react";
import Avatar from "@/shared/ui/Avatar";
import { cn } from "@/ui/cn";
import { Empty } from "./statsAtoms";
import type { ContributorStats } from "@/core/types/stats";

interface P {
  list: ContributorStats[];
  currentUsername?: string;
  showTasks?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

export default function Leaderboard({
  list,
  currentUsername,
  showTasks,
  selectedId,
  onSelect,
}: P) {
  const downPos = useRef<{ x: number; y: number } | null>(null);

  if (!list.length) return <Empty text="暂无贡献者" />;

  const onDown = (e: React.MouseEvent) => {
    downPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleClick = (e: React.MouseEvent, id: string, active: boolean) => {
    if (!onSelect) return;
    const p = downPos.current;
    if (p && (Math.abs(e.clientX - p.x) > 5 || Math.abs(e.clientY - p.y) > 5))
      return;
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) return;
    onSelect(active ? "" : id);
  };

  return (
    <div className="space-y-2">
      {list.map((c, i) => {
        const active = selectedId === c.user.id;
        const isMe = !!currentUsername && c.user.username === currentUsername;
        const markTotal = c.includes + c.blacklists + c.fieldEdits;
        const editOps = c.editOps || 0;
        const barTotal = markTotal + editOps;

        return (
          <div
            key={c.user.id}
            onMouseDown={onDown}
            onClick={(e) => handleClick(e, c.user.id, active)}
            className={cn(
              "rounded-xl border p-4 transition-all",
              onSelect && "cursor-pointer",
              active
                ? "bg-muted/80 border-foreground/15 shadow-sm"
                : "hover:bg-muted/40 hover:border-foreground/10",
              isMe && !active && "border-primary/20 bg-primary/2",
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="w-6 text-center text-base font-bold tabular-nums text-muted-foreground/60 shrink-0">
                {i + 1}
              </span>
              <Avatar
                src={c.user.avatar}
                name={c.user.nickname || c.user.username || "?"}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold truncate">
                    {c.user.nickname || c.user.username || "匿名"}
                  </span>
                  {isMe && (
                    <span className="text-[11px] text-primary border border-primary/30 rounded-md px-1.5 py-px shrink-0 font-medium">
                      你
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground tabular-nums">
                  {c.totalOps} 次操作
                  {showTasks && c.taskCount != null && (
                    <span className="ml-2">· {c.taskCount} 个任务</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400 leading-none">
                  {c.score.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">积分</div>
              </div>
            </div>

            <div className="space-y-2 pl-9">
              {barTotal > 0 && (
                <div className="flex h-2 rounded-full overflow-hidden gap-0.5 bg-muted/50">
                  {c.includes > 0 && (
                    <div
                      className="bg-emerald-500 rounded-full"
                      style={{ flex: c.includes }}
                    />
                  )}
                  {c.blacklists > 0 && (
                    <div
                      className="bg-red-400 dark:bg-red-500 rounded-full"
                      style={{ flex: c.blacklists }}
                    />
                  )}
                  {c.fieldEdits > 0 && (
                    <div
                      className="bg-blue-400 dark:bg-blue-500 rounded-full"
                      style={{ flex: c.fieldEdits }}
                    />
                  )}
                  {editOps > 0 && (
                    <div
                      className="bg-amber-400 dark:bg-amber-500 rounded-full"
                      style={{ flex: editOps }}
                    />
                  )}
                </div>
              )}
              <div className="flex gap-4 text-sm tabular-nums flex-wrap">
                {c.includes > 0 && (
                  <span className="flex items-center gap-1.5">
                    <CircleCheckBig className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-muted-foreground">收录</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {c.includes}
                    </span>
                  </span>
                )}
                {c.blacklists > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Ban className="h-3.5 w-3.5 text-red-500 dark:text-red-400 shrink-0" />
                    <span className="text-muted-foreground">排除</span>
                    <span className="font-bold text-red-500 dark:text-red-400">
                      {c.blacklists}
                    </span>
                  </span>
                )}
                {c.fieldEdits > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Pencil className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                    <span className="text-muted-foreground">标注编辑</span>
                    <span className="font-bold text-blue-500 dark:text-blue-400">
                      {c.fieldEdits}
                    </span>
                  </span>
                )}
                {editOps > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                    <span className="text-muted-foreground">运维操作</span>
                    <span className="font-bold text-amber-500 dark:text-amber-400">
                      {editOps}
                    </span>
                    {(c.editScore || 0) > 0 && (
                      <span className="text-xs text-muted-foreground">
                        (+{c.editScore}分)
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
