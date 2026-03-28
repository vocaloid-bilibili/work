// src/modules/marking/check/CheckSection.tsx
import { useState } from "react";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { ChevronDown, ChevronRight, ShieldCheck } from "lucide-react";
import { cn } from "@/ui/cn";

interface P {
  icon: React.ReactNode;
  label: string;
  count: number;
  severity: "error" | "warn";
  confirmed?: boolean;
  onConfirm?: () => void;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function CheckSection({
  icon,
  label,
  count,
  severity,
  confirmed,
  onConfirm,
  children,
  defaultOpen = false,
}: P) {
  const [open, setOpen] = useState(defaultOpen);
  if (count === 0) return null;
  const isErr = severity === "error";
  const isDone = !isErr && confirmed;

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden transition-colors",
        isErr
          ? "border-red-200/80 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/10"
          : isDone
            ? "border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10"
            : "border-amber-200/80 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10",
      )}
    >
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/3 dark:hover:bg-white/3 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="shrink-0">{icon}</span>
        <span className="text-sm font-medium flex-1 min-w-0 truncate">
          {label}
        </span>
        <Badge
          variant={isErr ? "destructive" : isDone ? "secondary" : "outline"}
          className="text-[11px] h-5 px-1.5 tabular-nums shrink-0"
        >
          {count}
        </Badge>
        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 hidden sm:inline",
            isErr
              ? "text-red-600 dark:text-red-400 bg-red-100/60 dark:bg-red-900/30"
              : isDone
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/30"
                : "text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/30",
          )}
        >
          {isErr ? "阻止导出" : isDone ? "已确认" : "需确认"}
        </span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="border-t border-inherit">
          {onConfirm && !isDone && (
            <div className="flex items-center justify-end px-3 py-1.5 bg-muted/30">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[11px] gap-1"
                onClick={onConfirm}
              >
                <ShieldCheck className="h-3 w-3" />
                确认无误
              </Button>
            </div>
          )}
          <div className="px-1 py-1">{children}</div>
        </div>
      )}
    </div>
  );
}
