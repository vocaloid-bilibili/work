import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, ShieldCheck, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckSectionProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  severity: "error" | "warn";
  confirmed?: boolean;
  onConfirm?: () => void;
  onBookmarkAll?: () => void;
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
  onBookmarkAll,
  children,
  defaultOpen = false,
}: CheckSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (count === 0) return null;

  const isError = severity === "error";
  const isConfirmed = !isError && confirmed;

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden transition-colors",
        isError
          ? "border-red-200/80 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/10"
          : isConfirmed
            ? "border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10"
            : "border-amber-200/80 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10",
      )}
    >
      {/* 头部 */}
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/2 dark:hover:bg-white/2 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="shrink-0">{icon}</span>
        <span className="text-sm font-medium flex-1 truncate">{label}</span>

        <Badge
          variant={
            isError ? "destructive" : isConfirmed ? "secondary" : "outline"
          }
          className="text-[11px] h-5 px-1.5 tabular-nums"
        >
          {count}
        </Badge>

        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded",
            isError
              ? "text-red-600 dark:text-red-400 bg-red-100/60 dark:bg-red-900/30"
              : isConfirmed
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/30"
                : "text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/30",
          )}
        >
          {isError ? "阻止导出" : isConfirmed ? "已确认" : "需确认"}
        </span>

        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* 展开内容 */}
      {open && (
        <div className="border-t border-inherit">
          {/* 批量操作栏 */}
          {(onBookmarkAll || (onConfirm && !isConfirmed)) && (
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-muted/30">
              <div>
                {onBookmarkAll && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[11px] text-muted-foreground gap-1"
                    onClick={onBookmarkAll}
                  >
                    <Bookmark className="h-3 w-3" />
                    全部加入书签
                  </Button>
                )}
              </div>
              <div>
                {onConfirm && !isConfirmed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[11px] gap-1"
                    onClick={onConfirm}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    确认无误
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* 列表 */}
          <div className="max-h-52 overflow-y-auto px-1 py-1">{children}</div>
        </div>
      )}
    </div>
  );
}
