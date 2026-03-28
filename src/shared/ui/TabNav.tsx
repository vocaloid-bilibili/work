// src/shared/ui/TabNav.tsx
import { cn } from "@/ui/cn";

export interface Tab<K extends string = string> {
  key: K;
  label: string;
}

interface P<K extends string> {
  tabs: Tab<K>[];
  active: K;
  onChange: (k: K) => void;
  className?: string;
}

export default function TabNav<K extends string>({
  tabs,
  active,
  onChange,
  className,
}: P<K>) {
  return (
    <div className={cn("flex gap-1 border-b", className)}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "px-3 py-2 text-sm font-medium border-b-2 transition-colors",
            active === t.key
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
