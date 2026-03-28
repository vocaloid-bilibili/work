// src/modules/stats/widgets.tsx
import type { ReactNode } from "react";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { Check, X, Pencil } from "lucide-react";
import type { UserProfile } from "@/core/types/stats";

/* ═══ 段落标题 ═══ */
export function Section({
  title,
  desc,
  right,
  children,
}: {
  title: string;
  desc?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {desc && (
            <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
          )}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

/* ═══ 用户筛选 chip ═══ */
export function UserChip({
  user,
  onClear,
}: {
  user: UserProfile | null;
  onClear: () => void;
}) {
  if (!user) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClear}
      className="text-xs h-7 gap-1 rounded-full"
    >
      {user.nickname || user.username || "用户"} ✕
    </Button>
  );
}

/* ═══ 空状态 ═══ */
export function Empty({ text }: { text: string }) {
  return (
    <p className="text-center text-sm text-muted-foreground py-14">{text}</p>
  );
}

/* ═══ Tab 导航 ═══ */
export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (k: T) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-muted/50">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
            active === t.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ═══ 操作类型图标 ═══ */
export const OP_ICONS = {
  include: { Icon: Check, color: "text-emerald-600 dark:text-emerald-400" },
  blacklist: { Icon: X, color: "text-red-500 dark:text-red-400" },
  edit: { Icon: Pencil, color: "text-blue-500 dark:text-blue-400" },
} as const;

/* ═══ 进度区块 ═══ */
export function ProgressBlock({
  recordCount,
  included,
  blacklisted,
  edits,
  totalOps,
}: {
  recordCount: number;
  included: number;
  blacklisted: number;
  edits?: number;
  totalOps?: number;
}) {
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
    <div className="space-y-6">
      {/* Hero 收录率 */}
      <div className="rounded-xl bg-emerald-500/10 px-6 py-5 sm:py-6 flex items-end justify-between gap-4">
        <div>
          <div className="text-sm text-emerald-700 dark:text-emerald-300 font-medium mb-1">
            收录率
          </div>
          <div className="text-5xl sm:text-6xl font-extrabold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400 leading-none">
            {pct.toFixed(1)}
            <span className="text-2xl sm:text-3xl font-bold">%</span>
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground tabular-nums pb-1">
          <div>共 {recordCount} 条</div>
          {pending > 0 && <div className="mt-0.5">{pending} 条待处理</div>}
          {pending === 0 && recordCount > 0 && (
            <div className="text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              全部完成
            </div>
          )}
        </div>
      </div>

      {/* 三数字行 */}
      <div className="grid grid-cols-3 gap-3">
        <NumBlock
          icon={<Check className="h-4 w-4" />}
          iconColor="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
          value={included}
          label="已收录"
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <NumBlock
          icon={<X className="h-4 w-4" />}
          iconColor="text-red-500 dark:text-red-400 bg-red-500/10"
          value={blacklisted}
          label="已排除"
          accent="text-red-500 dark:text-red-400"
        />
        <NumBlock
          icon={<Pencil className="h-3.5 w-3.5" />}
          iconColor="text-blue-500 dark:text-blue-400 bg-blue-500/10"
          value={edits ?? 0}
          label="已编辑"
          accent="text-blue-500 dark:text-blue-400"
        />
      </div>

      {/* 比例条 */}
      <div className="space-y-3">
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

      {/* 操作总数 */}
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
              <Check className="h-3.5 w-3.5" /> {included}
            </span>
            <span className="flex items-center gap-1.5 text-red-500 dark:text-red-400 font-medium">
              <X className="h-3.5 w-3.5" /> {blacklisted}
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

function NumBlock({
  icon,
  iconColor,
  value,
  label,
  accent,
}: {
  icon: ReactNode;
  iconColor: string;
  value: number;
  label: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border p-4 space-y-2">
      <span
        className={cn(
          "inline-flex items-center justify-center w-7 h-7 rounded-lg",
          iconColor,
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

/* ═══ 全局摘要卡片 ═══ */
export function GlobalCards({
  tasks,
  contributors,
  ops,
  score,
}: {
  tasks: number;
  contributors: number;
  ops: number;
  score: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard
        value={tasks}
        label="累计任务"
        bg="bg-violet-500/5"
        accent="text-violet-600 dark:text-violet-400"
      />
      <StatCard
        value={contributors}
        label="贡献者"
        bg="bg-blue-500/5"
        accent="text-blue-600 dark:text-blue-400"
      />
      <StatCard value={ops} label="总操作" bg="bg-muted/40" />
      <StatCard
        value={score}
        label="总积分"
        bg="bg-amber-500/5"
        accent="text-amber-600 dark:text-amber-400"
      />
    </div>
  );
}

function StatCard({
  value,
  label,
  accent,
  bg,
}: {
  value: number | string;
  label: string;
  accent?: string;
  bg?: string;
}) {
  return (
    <div className={cn("rounded-xl p-4 sm:p-5 space-y-1", bg || "bg-muted/40")}>
      <div
        className={cn(
          "text-3xl sm:text-4xl font-extrabold tabular-nums leading-none tracking-tight",
          accent || "text-foreground",
        )}
      >
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
