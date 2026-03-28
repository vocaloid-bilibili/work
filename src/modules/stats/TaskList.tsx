// src/modules/stats/TaskList.tsx
import { ChevronRight } from "lucide-react";
import { cn } from "@/ui/cn";
import { Empty } from "./statsAtoms";
import { taskName } from "./statsApi";
import type { TaskSummary } from "@/core/types/stats";

interface P {
  tasks: TaskSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export default function TaskList({ tasks, activeId, onSelect }: P) {
  if (!tasks.length) return <Empty text="暂无历史任务" />;

  return (
    <div className="space-y-2">
      {tasks.map((t) => {
        const active = t.taskId === activeId;
        return (
          <button
            key={t.taskId}
            onClick={() => onSelect(t.taskId)}
            className={cn(
              "w-full text-left p-4 rounded-xl border transition-all group",
              "hover:bg-muted/40 hover:shadow-sm active:scale-[0.995]",
              active && "border-emerald-300/60 dark:border-emerald-700/60",
            )}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base font-semibold truncate">
                  {taskName(t)}
                </span>
                {active && (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md shrink-0">
                    活跃
                  </span>
                )}
                {t.closedAt && !active && (
                  <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md shrink-0">
                    已关闭
                  </span>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition shrink-0" />
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground tabular-nums">
              <span>{t.createdAt?.slice(0, 10)}</span>
              <span>{t.recordCount} 条记录</span>
              <span>{t.contributorCount} 位贡献者</span>
              <span>{t.totalOperations} 次操作</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
