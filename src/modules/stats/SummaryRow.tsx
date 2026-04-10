// src/modules/stats/SummaryRow.tsx
import { cn } from "@/ui/cn";
import { ListTodo, Users, Activity, Trophy } from "lucide-react";
import type { GlobalStats, TaskStats } from "@/core/types/stats";

interface P {
  global: GlobalStats | null;
  task: TaskStats | null;
}

export default function SummaryRow({ global, task }: P) {
  if (!global) return null;

  const c = global.contributors;
  const totalOps = c.reduce((s, x) => s + x.totalOps, 0);
  const totalScore = Math.round(c.reduce((s, x) => s + x.score, 0));

  const items = [
    {
      icon: ListTodo,
      value: global.taskCount,
      label: "任务",
      color: "text-violet-500",
    },
    { icon: Users, value: c.length, label: "贡献者", color: "text-blue-500" },
    {
      icon: Activity,
      value: totalOps,
      label: "操作",
      color: "text-foreground/60",
    },
    { icon: Trophy, value: totalScore, label: "积分", color: "text-amber-500" },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex items-center gap-2.5 rounded-xl border bg-card px-4 py-3 min-w-0 shrink-0"
        >
          <it.icon className={cn("h-4 w-4 shrink-0", it.color)} />
          <span className="text-lg font-bold tabular-nums leading-none">
            {it.value}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {it.label}
          </span>
        </div>
      ))}

      {task && task.recordCount > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border bg-card px-4 py-3 min-w-0 shrink-0 ml-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">当前任务</span>
            <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {((task.totalIncluded / task.recordCount) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{
                width: `${(task.totalIncluded / task.recordCount) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {task.totalIncluded}/{task.recordCount}
          </span>
        </div>
      )}
    </div>
  );
}
