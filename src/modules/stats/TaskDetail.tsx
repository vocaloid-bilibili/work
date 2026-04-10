// src/modules/stats/TaskDetail.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/ui/button";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/ui/cn";
import { useAuth } from "@/shell/AuthProvider";
import { useFeed, useUserProfile, type Filter } from "./hooks";
import { api, taskName } from "./api";
import { toast } from "sonner";
import FilterBar from "./FilterBar";
import Feed from "./Feed";
import Contributors from "./Contributors";
import TaskHeader from "./TaskHeader";
import type { TaskStats, TaskSummary } from "@/core/types/stats";

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const nav = useNavigate();
  const { username } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [meta, setMeta] = useState<TaskSummary | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const feed = useFeed(taskId ?? null, selectedUser, filter);
  const contributors = useMemo(() => stats?.contributors ?? [], [stats]);
  const userProfile = useUserProfile(selectedUser, contributors);

  const load = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const [s, ts] = await Promise.all([api.taskStats(taskId), api.tasks()]);
      setStats(s);
      setMeta(ts.find((t) => t.taskId === taskId) || null);
    } catch (e: any) {
      toast.error(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleUser = useCallback(
    (id: string) => setSelectedUser((p) => (p === id ? null : id)),
    [],
  );
  const clearUser = useCallback(() => setSelectedUser(null), []);

  useEffect(() => {
    const handler = () => {
      if (selectedUser || filter !== "all") {
        setSelectedUser(null);
        setFilter("all");
        window.history.pushState(null, "");
        return;
      }
      nav("/stats", { replace: true });
    };
    window.history.pushState(null, "");
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [nav, selectedUser, filter]);

  const feedReload = feed.reload;
  const reload = useCallback(() => {
    void load();
    feedReload();
  }, [load, feedReload]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 -ml-2 shrink-0"
          onClick={() => nav("/stats")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">
            {meta ? taskName(meta) : "任务详情"}
          </h1>
          {meta && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {meta.createdAt?.slice(0, 10)}
              {meta.contributorCount != null &&
                ` · ${meta.contributorCount} 人`}
              {meta.closedAt && " · 已关闭"}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={reload}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {stats ? (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="space-y-4 min-w-0">
            <TaskHeader task={stats} />
            <FilterBar
              filter={filter}
              onFilter={setFilter}
              user={userProfile}
              onClearUser={clearUser}
            />
            <Feed feed={feed} onClickUser={toggleUser} />
          </div>
          <div className="lg:sticky lg:top-4 rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-3">
              <span className="text-sm font-bold">贡献者</span>
            </div>
            <div className="px-2 pb-2">
              <Contributors
                list={contributors}
                currentUsername={username || ""}
                selectedId={selectedUser}
                onSelect={toggleUser}
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-20">任务不存在</p>
      )}
    </div>
  );
}
