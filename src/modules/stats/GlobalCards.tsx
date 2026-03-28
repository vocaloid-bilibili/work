// src/modules/stats/GlobalCards.tsx
import { cn } from "@/ui/cn";
import { ListTodo, Users, Activity, Trophy } from "lucide-react";
import type { ReactNode } from "react";

interface P {
  tasks: number;
  contributors: number;
  ops: number;
  score: number;
}

export default function GlobalCards({ tasks, contributors, ops, score }: P) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <GCard
        icon={<ListTodo className="h-4.5 w-4.5" />}
        iconCls="text-violet-600 dark:text-violet-400 bg-violet-500/10"
        value={tasks}
        label="累计任务"
        accent="text-violet-600 dark:text-violet-400"
      />
      <GCard
        icon={<Users className="h-4.5 w-4.5" />}
        iconCls="text-blue-600 dark:text-blue-400 bg-blue-500/10"
        value={contributors}
        label="贡献者"
        accent="text-blue-600 dark:text-blue-400"
      />
      <GCard
        icon={<Activity className="h-4.5 w-4.5" />}
        iconCls="text-foreground/60 bg-muted/60"
        value={ops}
        label="总操作"
      />
      <GCard
        icon={<Trophy className="h-4.5 w-4.5" />}
        iconCls="text-amber-600 dark:text-amber-400 bg-amber-500/10"
        value={score}
        label="总积分"
        accent="text-amber-600 dark:text-amber-400"
      />
    </div>
  );
}

function GCard({
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
  accent?: string;
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
          "text-3xl font-extrabold tabular-nums leading-none",
          accent || "text-foreground",
        )}
      >
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
