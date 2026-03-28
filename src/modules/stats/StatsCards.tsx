// src/modules/stats/StatsCards.tsx
import type { TaskStats } from "@/core/types/stats";

export default function StatsCards({ stats }: { stats: TaskStats }) {
  const items = [
    { label: "已收录", value: stats.totalIncluded, color: "text-emerald-600" },
    { label: "已排除", value: stats.totalBlacklisted, color: "text-red-500" },
    { label: "已编辑", value: stats.totalFieldEdits, color: "text-blue-500" },
    { label: "总操作", value: stats.totalOperations },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map((i) => (
        <div key={i.label} className="rounded-xl border p-3">
          <div className="text-[11px] text-muted-foreground">{i.label}</div>
          <div
            className={`text-xl sm:text-2xl font-bold tabular-nums ${i.color ?? ""}`}
          >
            {i.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
