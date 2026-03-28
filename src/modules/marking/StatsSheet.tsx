// src/modules/marking/StatsSheet.tsx
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/ui/button";
import { Separator } from "@/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/ui/sheet";
import { BarChart3, Users, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/ui/cn";
import TabNav from "@/shared/ui/TabNav";
import StatsCards from "@/modules/stats/StatsCards";
import RatioBar from "@/modules/stats/RatioBar";
import ContributorList from "@/modules/stats/ContributorList";
import RecentOps from "@/modules/stats/RecentOps";
import type { TaskStats, LogEntry } from "@/core/types/stats";

interface P {
  taskId: string | null;
  fetchStats: (id?: string) => Promise<TaskStats>;
  fetchOps?: (
    id: string,
    limit: number,
    offset: number,
  ) => Promise<{ ops: LogEntry[]; total: number; hasMore: boolean }>;
}

type Tab = "overview" | "ops";

export default function StatsSheet({ taskId, fetchStats, fetchOps }: P) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [ops, setOps] = useState<LogEntry[]>([]);
  const [opsTotal, setOpsTotal] = useState(0);
  const [opsMore, setOpsMore] = useState(false);
  const [opsInit, setOpsInit] = useState(false);

  const load = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      setStats(await fetchStats(taskId));
      setOpsInit(false);
      setOps([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [taskId, fetchStats]);

  useEffect(() => {
    if (open && taskId) void load();
  }, [open, taskId, load]);

  const onTab = useCallback(
    (k: Tab) => {
      setTab(k);
      if (k === "ops" && !opsInit && stats) {
        const init = stats.recentOps || [];
        setOps(init);
        setOpsMore(init.length >= 200);
        setOpsTotal(init.length);
        setOpsInit(true);
      }
    },
    [opsInit, stats],
  );
  const loadMore = useCallback(async () => {
    if (!fetchOps || !taskId) return;
    const r = await fetchOps(taskId, 100, ops.length);
    setOps((p) => [...p, ...r.ops]);
    setOpsTotal(r.total);
    setOpsMore(r.hasMore);
  }, [fetchOps, taskId, ops.length]);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setOpsInit(false);
          setOps([]);
          setTab("overview");
        }
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          统计
        </Button>
      </SheetTrigger>
      <SheetContent className="w-95 sm:w-110 max-w-full p-0 flex flex-col">
        <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 shrink-0">
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              任务统计
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </SheetTitle>
        </SheetHeader>
        <div className="px-4 sm:px-6 shrink-0">
          <TabNav
            tabs={[
              { key: "overview" as const, label: "概览" },
              { key: "ops" as const, label: "操作记录" },
            ]}
            active={tab}
            onChange={onTab}
          />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="px-4 sm:px-6">
            {loading && !stats ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            ) : stats ? (
              <>
                {tab === "overview" && (
                  <div className="space-y-5 pb-6 pt-3">
                    <StatsCards stats={stats} />
                    <RatioBar
                      recordCount={stats.recordCount}
                      totalIncluded={stats.totalIncluded}
                      totalBlacklisted={stats.totalBlacklisted}
                    />
                    <Separator />
                    <ContributorList
                      contributors={stats.contributors}
                      totalOps={stats.totalOperations}
                    />
                  </div>
                )}
                {tab === "ops" && (
                  <div className="pb-6 pt-3">
                    <h3 className="text-sm font-semibold mb-3">
                      操作记录{" "}
                      <span className="text-muted-foreground font-normal ml-1 tabular-nums">
                        ({ops.length}
                        {opsTotal > ops.length && ` / ${opsTotal}`} 条)
                      </span>
                    </h3>
                    <RecentOps
                      ops={ops}
                      total={opsTotal}
                      hasMore={opsMore}
                      onLoadMore={fetchOps ? loadMore : undefined}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-20 text-sm">
                {taskId ? "点击刷新" : "暂无活跃任务"}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
