// src/components/contributions/ContributionTabs.tsx

import { cn } from "@/lib/utils";

export type TabKey = "ranking" | "tasks" | "recent";

const tabs: { key: TabKey; label: string }[] = [
  { key: "ranking", label: "贡献排行" },
  { key: "tasks", label: "历史任务" },
  { key: "recent", label: "最近操作" },
];

interface Props {
  active: TabKey;
  onChange: (key: TabKey) => void;
}

export default function ContributionTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-1 border-b">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          className={cn(
            "px-3 py-2 text-sm font-medium border-b-2 transition-colors",
            active === key
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground active:text-foreground",
          )}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
