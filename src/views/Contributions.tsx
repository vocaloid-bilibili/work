// src/views/Contributions.tsx
import { useState, useEffect, useCallback } from "react";
import { requestCollabJson } from "@/utils/collabApi";
import { Loader2, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import FieldBreakdown from "@/components/contributions/FieldBreakdown";
import RecentOps from "@/components/contributions/RecentOps";
import DetailDialog from "@/components/contributions/DetailDialog";
import type {
  GlobalStats,
  TaskStats,
  TaskSummaryItem,
} from "@/components/contributions/types";
import RatioBar from "@/components/contributions/RatioBar";
import ContributorList from "@/components/contributions/ContributorList";
const fmt = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

type TabKey = "ranking" | "tasks" | "recent";

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

      // 加载当前活跃任务的 stats（用于 recent ops 和 field breakdown）
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
        // 没有活跃任务也不报错
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
      {/* 标题 */}
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

      {/* 概览卡片 */}
      {activeStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border p-3">
            <div className="text-[11px] text-muted-foreground">
              当前任务记录
            </div>
            <div className="text-2xl font-bold">{activeStats.recordCount}</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-[11px] text-muted-foreground">已收录</div>
            <div className="text-2xl font-bold text-emerald-600">
              {activeStats.totalIncluded}
            </div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-[11px] text-muted-foreground">已排除</div>
            <div className="text-2xl font-bold text-red-500">
              {activeStats.totalBlacklisted}
            </div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-[11px] text-muted-foreground">总操作</div>
            <div className="text-2xl font-bold">
              {activeStats.totalOperations}
            </div>
          </div>
        </div>
      )}

      {activeStats && (
        <RatioBar
          recordCount={activeStats.recordCount}
          totalIncluded={activeStats.totalIncluded}
          totalBlacklisted={activeStats.totalBlacklisted}
        />
      )}

      {/* Tab 切换 */}
      <div className="flex gap-1 border-b">
        {(
          [
            { key: "ranking" as const, label: "贡献排行" },
            { key: "tasks" as const, label: "历史任务" },
            { key: "recent" as const, label: "最近操作" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 排行 */}
      {activeTab === "ranking" && (
        <div className="space-y-6">
          <ContributorList contributors={sorted} />
          {activeStats && (
            <>
              <Separator />
              <FieldBreakdown breakdown={activeStats.fieldBreakdown} />
            </>
          )}
        </div>
      )}

      {/* 历史任务 */}
      {activeTab === "tasks" && (
        <div className="space-y-3">
          {taskList.length === 0 ? (
            <div className="text-center text-muted-foreground py-16 text-sm">
              暂无历史任务
            </div>
          ) : (
            taskList.map((t) => (
              <div
                key={t.taskId}
                className="rounded-xl border p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {t.fileMeta?.originalName || t.taskId.slice(0, 16)}
                      </span>
                      {!t.closedAt && (
                        <Badge className="text-[10px] px-1.5 py-0">当前</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{t.recordCount} 条</span>
                      <span>{t.totalOperations} 次操作</span>
                      <span>{t.contributorCount} 人</span>
                    </div>
                    <div className="flex gap-x-4 text-[11px] text-muted-foreground/70 mt-1">
                      <span>创建 {fmt(t.createdAt)}</span>
                      {t.closedAt && <span>关闭 {fmt(t.closedAt)}</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => loadDetail(t.taskId)}
                  >
                    详情
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 最近操作 */}
      {activeTab === "recent" && (
        <div>
          {activeStats?.recentOps && activeStats.recentOps.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                当前任务最近 {activeStats.recentOps.length} 条操作
              </p>
              <RecentOps ops={activeStats.recentOps} />
            </>
          ) : (
            <div className="text-center text-muted-foreground py-16 text-sm">
              暂无操作记录
            </div>
          )}
        </div>
      )}

      <DetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        loading={detailLoading}
        stats={detailStats}
      />
    </div>
  );
}
