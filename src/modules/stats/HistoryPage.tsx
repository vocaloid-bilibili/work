// src/modules/stats/HistoryPage.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { api, taskName } from "./api";
import { toast } from "sonner";
import type { TaskSummary } from "@/core/types/stats";

export default function HistoryPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, ts] = await Promise.all([api.active(), api.tasks()]);
      setActiveId(a.taskId || null);
      setTasks(ts);
    } catch (e: any) {
      toast.error(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 -ml-2 shrink-0"
          onClick={() => nav("/stats")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold">全部任务</h1>
        <span className="text-sm text-muted-foreground">({tasks.length})</span>
      </div>

      {!tasks.length ? (
        <p className="text-center text-muted-foreground py-20">暂无任务</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => {
            const active = t.taskId === activeId;
            return (
              <button
                key={t.taskId}
                onClick={() => nav(`/stats/${t.taskId}`)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all group",
                  "hover:bg-muted/40 hover:shadow-sm active:scale-[0.995]",
                  active && "border-emerald-300/60 dark:border-emerald-700/60",
                )}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base font-semibold truncate">
                      {taskName(t)}
                    </span>
                    {active && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md shrink-0">
                        活跃
                      </span>
                    )}
                    {t.closedAt && !active && (
                      <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md shrink-0">
                        已关闭
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition shrink-0" />
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground tabular-nums">
                  <span>{t.createdAt?.slice(0, 10)}</span>
                  <span>{t.recordCount} 条</span>
                  <span>{t.contributorCount} 人</span>
                  <span>{t.totalOperations} 次操作</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
