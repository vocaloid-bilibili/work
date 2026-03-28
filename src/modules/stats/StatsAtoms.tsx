// src/modules/stats/statsAtoms.tsx
import type { ReactNode } from "react";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import type { UserProfile } from "@/core/types/stats";

export function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-lg font-bold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

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

export function Empty({ text }: { text: string }) {
  return (
    <p className="text-center text-sm text-muted-foreground py-14">{text}</p>
  );
}

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
