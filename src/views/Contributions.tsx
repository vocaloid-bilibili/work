// src/views/Contributions.tsx
import { useState, useEffect, useCallback } from "react";
import { requestCollabJson } from "@/utils/collabApi";
import { Loader2, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCards from "@/components/contributions/StatsCards";
import RatioBar from "@/components/contributions/RatioBar";
import ContributionTabs from "@/components/contributions/ContributionTabs";
import RankingTab from "@/components/contributions/RankingTab";
import TasksTab from "@/components/contributions/TasksTab";
import RecentTab from "@/components/contributions/RecentTab";
import DetailDialog from "@/components/contributions/DetailDialog";
import type {
  GlobalStats,
  TaskStats,
  TaskSummaryItem,
} from "@/components/contributions/types";
import type { TabKey } from "@/components/contributions/ContributionTabs";

export default function Contributions() {
  const [loading, setLoading] = useState(true);
  const [globalData, setGlobalData] = useState<GlobalStats | null>(null);
  const [taskList, setTaskList] = useState<TaskSummaryItem[]>([]);
  const [activeStats, setActiveStats] = useState<TaskStats | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("ranking");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailStats, setDetailStats] = useState<TaskStats | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [global, tasks] = await Promise.all([
        requestCollabJson<GlobalStats>("/mark/tasks/stats/global"),
        requestCollabJson<{ tasks: TaskSummaryItem[] }>("/mark/tasks"),
      ]);
      setGlobalData(global);
      setTaskList(tasks.tasks);

      try {
        const active = await requestCollabJson<{
          taskId: string;
          version: number;
        }>("/mark/tasks/active");
        if (active.taskId) {
          const stats = await requestCollabJson<TaskStats>(
            `/mark/tasks/${active.taskId}/stats`,
          );
          setActiveStats(stats);
        }
      } catch {
        // 没有活跃任务不报错
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const stats = await requestCollabJson<TaskStats>(
        `/mark/tasks/${id}/stats`,
      );
      setDetailStats(stats);
    } catch {
      setDetailStats(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const sorted = globalData
    ? [...globalData.contributors].sort((a, b) => b.score - a.score)
    : [];

  if (loading && !globalData) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !globalData) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h1 className="text-xl font-bold">贡献统计</h1>
          {globalData && (
            <span className="text-sm text-muted-foreground">
              · {globalData.taskCount} 个任务 · {sorted.length} 位贡献者
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {activeStats && <StatsCards stats={activeStats} />}
      {activeStats && (
        <RatioBar
          recordCount={activeStats.recordCount}
          totalIncluded={activeStats.totalIncluded}
          totalBlacklisted={activeStats.totalBlacklisted}
        />
      )}

      <ContributionTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "ranking" && (
        <RankingTab contributors={sorted} activeStats={activeStats} />
      )}
      {activeTab === "tasks" && (
        <TasksTab tasks={taskList} onDetail={loadDetail} />
      )}
      {activeTab === "recent" && <RecentTab activeStats={activeStats} />}

      <DetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        loading={detailLoading}
        stats={detailStats}
      />
    </div>
  );
}
