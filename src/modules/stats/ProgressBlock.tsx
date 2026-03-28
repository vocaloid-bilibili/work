// src/modules/stats/ProgressBlock.tsx
import { CircleCheckBig, Ban, Pencil } from "lucide-react";
import { cn } from "@/ui/cn";
import type { ReactNode } from "react";

interface P {
  recordCount: number;
  included: number;
  blacklisted: number;
  edits?: number;
  totalOps?: number;
}

export default function ProgressBlock({
  recordCount,
  included,
  blacklisted,
  edits,
  totalOps,
}: P) {
  const pending = Math.max(0, recordCount - included - blacklisted);
  const pct = recordCount > 0 ? (included / recordCount) * 100 : 0;

  const segs: { n: number; color: string; label: string; text: string }[] = [
    {
      n: included,
      color: "bg-emerald-500",
      label: "收录",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    {
      n: blacklisted,
      color: "bg-red-400 dark:bg-red-500",
      label: "排除",
      text: "text-red-500 dark:text-red-400",
    },
    {
      n: pending,
      color: "bg-zinc-200 dark:bg-zinc-700",
      label: "待处理",
      text: "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card
          icon={<CircleCheckBig className="h-4.5 w-4.5" />}
          iconCls="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
          value={included}
          label="已收录"
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <Card
          icon={<Ban className="h-4.5 w-4.5" />}
          iconCls="text-red-500 dark:text-red-400 bg-red-500/10"
          value={blacklisted}
          label="已排除"
          accent="text-red-500 dark:text-red-400"
        />
        <Card
          icon={<Pencil className="h-4 w-4" />}
          iconCls="text-blue-500 dark:text-blue-400 bg-blue-500/10"
          value={edits ?? 0}
          label="已编辑"
          accent="text-blue-500 dark:text-blue-400"
        />
      </div>

      <div className="rounded-xl border p-4 sm:p-5 space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground">收录率</span>
            <span className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {pct.toFixed(1)}%
            </span>
          </div>
          <span className="text-sm text-muted-foreground tabular-nums">
            {pending > 0
              ? `${pending} 条待处理 / 共 ${recordCount}`
              : recordCount > 0
                ? `全部完成 · 共 ${recordCount}`
                : `共 ${recordCount}`}
          </span>
        </div>

        <div className="flex h-3 rounded-full overflow-hidden gap-0.5 bg-muted/30">
          {segs.map(
            (s) =>
              s.n > 0 && (
                <div
                  key={s.label}
                  className={cn(
                    "transition-all duration-700 first:rounded-l-full last:rounded-r-full",
                    s.color,
                  )}
                  style={{ flex: s.n }}
                />
              ),
          )}
        </div>

        <div className="flex gap-5 flex-wrap">
          {segs.map((s) => (
            <span key={s.label} className="flex items-center gap-2 text-sm">
              <span
                className={cn("w-2.5 h-2.5 rounded-full shrink-0", s.color)}
              />
              <span className="text-muted-foreground">{s.label}</span>
              <span className={cn("font-bold tabular-nums", s.text)}>
                {s.n}
              </span>
            </span>
          ))}
        </div>
      </div>

      {totalOps != null && (
        <div className="flex items-center gap-4 rounded-xl bg-muted/30 px-5 py-3.5">
          <div>
            <span className="text-2xl font-extrabold tabular-nums">
              {totalOps}
            </span>
            <span className="text-sm text-muted-foreground ml-2">次操作</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex gap-4 text-sm tabular-nums">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CircleCheckBig className="h-3.5 w-3.5" /> {included}
            </span>
            <span className="flex items-center gap-1.5 text-red-500 dark:text-red-400 font-medium">
              <Ban className="h-3.5 w-3.5" /> {blacklisted}
            </span>
            <span className="flex items-center gap-1.5 text-blue-500 dark:text-blue-400 font-medium">
              <Pencil className="h-3 w-3" /> {edits ?? 0}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({
  icon,
  iconCls,
  value,
  label,
  accent,
}: {
  icon: ReactNode;
  iconCls: string;
  value: number;
  label: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border p-4 space-y-2">
      <span
        className={cn(
          "inline-flex items-center justify-center w-8 h-8 rounded-lg",
          iconCls,
        )}
      >
        {icon}
      </span>
      <div
        className={cn(
          "text-3xl sm:text-4xl font-extrabold tabular-nums leading-none",
          accent,
        )}
      >
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
