// src/components/mark/TaskStatsPanel.tsx

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BarChart3, Users, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import StatsCards from "@/components/contributions/StatsCards";
import RatioBar from "@/components/contributions/RatioBar";
import ContributorList from "@/components/contributions/ContributorList";
import RecentOps from "@/components/contributions/RecentOps";
import type {
  TaskStats,
  EnrichedLogEntry,
} from "@/components/contributions/types";

interface Props {
  currentTaskId: string | null;
  fetchTaskStats: (taskId?: string) => Promise<TaskStats>;
  fetchTaskOps?: (
    taskId: string,
    limit: number,
    offset: number,
  ) => Promise<{ ops: EnrichedLogEntry[]; total: number; hasMore: boolean }>;
}

type TabKey = "overview" | "ops";

const PAGE_SIZE = 100;

export default function TaskStatsPanel({
  currentTaskId,
  fetchTaskStats,
  fetchTaskOps,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [currentStats, setCurrentStats] = useState<TaskStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // 分页操作记录
  const [allOps, setAllOps] = useState<EnrichedLogEntry[]>([]);
  const [opsTotal, setOpsTotal] = useState(0);
  const [opsHasMore, setOpsHasMore] = useState(false);
  const [opsInited, setOpsInited] = useState(false);

  const loadStats = useCallback(async () => {
    if (!currentTaskId) return;
    setStatsLoading(true);
    try {
      const stats = await fetchTaskStats(currentTaskId);
      setCurrentStats(stats);
      // 重置操作记录分页
      setOpsInited(false);
      setAllOps([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "加载失败");
    } finally {
      setStatsLoading(false);
    }
  }, [currentTaskId, fetchTaskStats]);

  useEffect(() => {
    if (sheetOpen && currentTaskId) void loadStats();
  }, [sheetOpen, currentTaskId, loadStats]);

  const handleTabChange = useCallback(
    (key: TabKey) => {
      setActiveTab(key);
      if (key === "ops" && !opsInited && currentStats) {
        const initial = currentStats.recentOps || [];
        setAllOps(initial);
        setOpsHasMore(initial.length >= 200);
        setOpsTotal(initial.length);
        setOpsInited(true);
      }
    },
    [opsInited, currentStats],
  );

  const handleLoadMore = useCallback(async () => {
    if (!fetchTaskOps || !currentTaskId) return;
    const offset = allOps.length;
    const result = await fetchTaskOps(currentTaskId, PAGE_SIZE, offset);
    setAllOps((prev) => [...prev, ...result.ops]);
    setOpsTotal(result.total);
    setOpsHasMore(result.hasMore);
  }, [fetchTaskOps, currentTaskId, allOps.length]);

  const handleSheetChange = useCallback((v: boolean) => {
    setSheetOpen(v);
    if (!v) {
      setOpsInited(false);
      setAllOps([]);
      setActiveTab("overview");
    }
  }, []);

  return (
    <Sheet open={sheetOpen} onOpenChange={handleSheetChange}>
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
              onClick={loadStats}
              disabled={statsLoading}
            >
              <RefreshCw
                className={cn("h-4 w-4", statsLoading && "animate-spin")}
              />
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 sm:px-6 flex gap-1 border-b shrink-0">
          {(
            [
              { key: "overview" as const, label: "概览" },
              { key: "ops" as const, label: "操作记录" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              className={cn(
                "px-3 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
              onClick={() => handleTabChange(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="px-4 sm:px-6">
            {statsLoading && !currentStats ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            ) : currentStats ? (
              <>
                {activeTab === "overview" && (
                  <div className="space-y-5 pb-6 pt-3">
                    <StatsCards stats={currentStats} />
                    <RatioBar
                      recordCount={currentStats.recordCount}
                      totalIncluded={currentStats.totalIncluded}
                      totalBlacklisted={currentStats.totalBlacklisted}
                    />
                    <Separator />
                    <ContributorList
                      contributors={currentStats.contributors}
                      totalOps={currentStats.totalOperations}
                    />
                  </div>
                )}
                {activeTab === "ops" && (
                  <div className="pb-6 pt-3">
                    <h3 className="text-sm font-semibold mb-3">
                      操作记录
                      <span className="text-muted-foreground font-normal ml-1 tabular-nums">
                        ({allOps.length}
                        {opsTotal > allOps.length && ` / ${opsTotal}`} 条)
                      </span>
                    </h3>
                    <RecentOps
                      ops={allOps}
                      total={opsTotal}
                      hasMore={opsHasMore}
                      onLoadMore={fetchTaskOps ? handleLoadMore : undefined}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-20 text-sm">
                {currentTaskId ? "点击刷新" : "暂无活跃任务"}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
