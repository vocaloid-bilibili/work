// src/components/mark/TaskStatsPanel.tsx
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import StatsCards from "@/components/contributions/StatsCards";
import RatioBar from "@/components/contributions/RatioBar";
import ContributorList from "@/components/contributions/ContributorList";
import RecentOps from "@/components/contributions/RecentOps";
import type { TaskStats } from "@/components/contributions/types";

interface Props {
  currentTaskId: string | null;
  fetchTaskStats: (taskId?: string) => Promise<TaskStats>;
}

type TabKey = "overview" | "ops";

export default function TaskStatsPanel({
  currentTaskId,
  fetchTaskStats,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [currentStats, setCurrentStats] = useState<TaskStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const loadStats = useCallback(async () => {
    if (!currentTaskId) return;
    setStatsLoading(true);
    try {
      setCurrentStats(await fetchTaskStats(currentTaskId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "加载失败");
    } finally {
      setStatsLoading(false);
    }
  }, [currentTaskId, fetchTaskStats]);

  useEffect(() => {
    if (sheetOpen && currentTaskId) void loadStats();
  }, [sheetOpen, currentTaskId, loadStats]);

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          统计
        </Button>
      </SheetTrigger>
      <SheetContent className="w-95 sm:w-110 p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-2">
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
                className={`h-4 w-4 ${statsLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="px-6 flex gap-1 border-b">
          <button
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            概览
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "ops"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("ops")}
          >
            操作记录
          </button>
        </div>

        <ScrollArea className="flex-1 px-6">
          {statsLoading && !currentStats ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : currentStats ? (
            <>
              {activeTab === "overview" && (
                <div className="space-y-6 pb-6 pt-4">
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
                <div className="pb-6 pt-4">
                  <h3 className="text-sm font-semibold mb-3">
                    最近操作
                    <span className="text-muted-foreground font-normal ml-1">
                      (最新 {currentStats.recentOps?.length || 0} 条)
                    </span>
                  </h3>
                  <RecentOps ops={currentStats.recentOps || []} />
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground py-20 text-sm">
              {currentTaskId ? "点击刷新" : "暂无活跃任务"}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
