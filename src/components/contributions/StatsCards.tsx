// src/components/contributions/StatsCards.tsx
import type { TaskStats } from "./types";

export default function StatsCards({ stats }: { stats: TaskStats }) {
  const items = [
    { label: "当前任务记录", value: stats.recordCount },
    { label: "已收录", value: stats.totalIncluded, color: "text-emerald-600" },
    { label: "已排除", value: stats.totalBlacklisted, color: "text-red-500" },
    { label: "总操作", value: stats.totalOperations },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border p-3">
          <div className="text-[11px] text-muted-foreground">{item.label}</div>
          <div className={`text-2xl font-bold ${item.color ?? ""}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
