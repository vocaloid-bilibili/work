// src/modules/stats/TaskHeader.tsx
import { cn } from "@/ui/cn";
import { CircleCheckBig, Ban, Clock } from "lucide-react";
import type { TaskStats } from "@/core/types/stats";

interface P {
  task: TaskStats;
}

export default function TaskHeader({ task }: P) {
  const { recordCount: rc, totalIncluded: inc, totalBlacklisted: bl } = task;
  const pending = Math.max(0, rc - inc - bl);
  const pct = rc > 0 ? (inc / rc) * 100 : 0;

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
            {pct.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {pending > 0 ? `${pending} 待处理` : "全部完成"} · 共 {rc} 条
          </span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5 bg-muted/40">
          {inc > 0 && (
            <div
              className="bg-emerald-500 rounded-full transition-all duration-500"
              style={{ flex: inc }}
            />
          )}
          {bl > 0 && (
            <div
              className="bg-rose-500 rounded-full transition-all duration-500"
              style={{ flex: bl }}
            />
          )}
          {pending > 0 && (
            <div
              className="bg-zinc-200 dark:bg-zinc-700 rounded-full"
              style={{ flex: pending }}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Metric
          icon={CircleCheckBig}
          color="text-emerald-500"
          value={inc}
          label="收录"
        />
        <Metric icon={Ban} color="text-rose-500" value={bl} label="排除" />
        <Metric
          icon={Clock}
          color="text-muted-foreground"
          value={task.totalOperations}
          label="操作"
        />
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  color,
  value,
  label,
}: {
  icon: typeof CircleCheckBig;
  color: string;
  value: number;
  label: string;
}) {
  return (
    <div className="text-center space-y-0.5">
      <Icon className={cn("h-3.5 w-3.5 mx-auto", color)} />
      <div className="text-lg font-bold tabular-nums leading-none">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
