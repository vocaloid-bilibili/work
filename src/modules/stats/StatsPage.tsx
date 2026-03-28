// src/modules/stats/StatsPage.tsx
import { useState, useEffect, useCallback } from "react";
import { collabGet } from "@/core/api/collabClient";
import { Loader2, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/ui/button";
import TabNav from "@/shared/ui/TabNav";
import StatsCards from "./StatsCards";
import RatioBar from "./RatioBar";
import ContributorList from "./ContributorList";
import FieldBreakdown from "./FieldBreakdown";
import { Separator } from "@/ui/separator";
import TaskList from "./TaskList";
import RecentOps from "./RecentOps";
import DetailDialog from "./DetailDialog";
import type {
  GlobalStats,
  TaskStats,
  TaskSummary,
  LogEntry,
} from "@/core/types/stats";

type Tab = "ranking" | "tasks" | "recent";
const TABS: { key: Tab; label: string }[] = [
  { key: "ranking", label: "贡献排行" },
  { key: "tasks", label: "历史任务" },
  { key: "recent", label: "最近操作" },
];

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [global, setGlobal] = useState<GlobalStats | null>(null);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [active, setActive] = useState<TaskStats | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("ranking");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailStats, setDetailStats] = useState<TaskStats | null>(null);

  // RecentTab 分页
  const [recentOps, setRecentOps] = useState<LogEntry[]>([]);
  const [recentTotal, setRecentTotal] = useState(0);
  const [recentMore, setRecentMore] = useState(false);
  const [recentInit, setRecentInit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [g, t] = await Promise.all([
        collabGet<GlobalStats>("/mark/tasks/stats/global"),
        collabGet<{ tasks: TaskSummary[] }>("/mark/tasks"),
      ]);
      setGlobal(g);
      setTasks(t.tasks);
      try {
        const a = await collabGet<{ taskId: string; version: number }>(
          "/mark/tasks/active",
        );
        if (a.taskId) {
          const s = await collabGet<TaskStats>(`/mark/tasks/${a.taskId}/stats`);
          setActive(s);
        }
      } catch {
        /* no active */
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
      setDetailStats(await collabGet<TaskStats>(`/mark/tasks/${id}/stats`));
    } catch {
      setDetailStats(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Recent tab init
  const onTabChange = useCallback(
    (k: Tab) => {
      setTab(k);
      if (k === "recent" && !recentInit && active) {
        const init = active.recentOps || [];
        setRecentOps(init);
        setRecentMore(init.length >= 200);
        setRecentTotal(init.length);
        setRecentInit(true);
      }
    },
    [recentInit, active],
  );

  const loadMoreRecent = useCallback(async () => {
    if (!active) return;
    const r = await collabGet<{
      ops: LogEntry[];
      total: number;
      hasMore: boolean;
    }>(`/mark/tasks/${active.taskId}/ops?limit=100&offset=${recentOps.length}`);
    setRecentOps((p) => [...p, ...r.ops]);
    setRecentTotal(r.total);
    setRecentMore(r.hasMore);
  }, [active, recentOps.length]);

  const sorted = global
    ? [...global.contributors].sort((a, b) => b.score - a.score)
    : [];

  if (loading && !global)
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  if (error && !global)
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>
          重试
        </Button>
      </div>
    );

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h1 className="text-xl font-bold">贡献统计</h1>
          {global && (
            <span className="text-sm text-muted-foreground">
              · {global.taskCount} 个任务 · {sorted.length} 位贡献者
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

      {active && <StatsCards stats={active} />}
      {active && (
        <RatioBar
          recordCount={active.recordCount}
          totalIncluded={active.totalIncluded}
          totalBlacklisted={active.totalBlacklisted}
        />
      )}

      <TabNav tabs={TABS} active={tab} onChange={onTabChange} />

      {tab === "ranking" && (
        <div className="space-y-6">
          <ContributorList contributors={sorted} />
          {active && (
            <>
              <Separator />
              <FieldBreakdown breakdown={active.fieldBreakdown} />
            </>
          )}
        </div>
      )}
      {tab === "tasks" && <TaskList tasks={tasks} onDetail={loadDetail} />}
      {tab === "recent" &&
        (active?.recentOps && active.recentOps.length > 0 ? (
          <div>
            <p className="text-sm text-muted-foreground mb-3 tabular-nums">
              当前任务共 {recentTotal} 条操作，已加载 {recentOps.length} 条
            </p>
            <RecentOps
              ops={recentOps}
              total={recentTotal}
              hasMore={recentMore}
              onLoadMore={loadMoreRecent}
            />
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-16 text-sm">
            暂无操作记录
          </div>
        ))}

      <DetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        loading={detailLoading}
        stats={detailStats}
      />
    </div>
  );
}
