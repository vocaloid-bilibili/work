// src/modules/stats/Dashboard.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { useAuth } from "@/shell/AuthProvider";
import { useDashboard, useFeed, useUserProfile, type Filter } from "./hooks";
import { taskName } from "./api";
import { ACTIONS } from "./actions";
import SummaryRow from "./SummaryRow";
import FilterBar from "./FilterBar";
import Feed from "./Feed";
import Contributors from "./Contributors";
import TaskHeader from "./TaskHeader";

export default function Dashboard() {
  const nav = useNavigate();
  const { username } = useAuth();
  const db = useDashboard();

  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [showContrib, setShowContrib] = useState(false);

  const feed = useFeed(null, filterUserId, filter);
  const contributors = useMemo(
    () => db.global?.contributors ?? [],
    [db.global],
  );
  const userProfile = useUserProfile(filterUserId, contributors);

  useEffect(() => {
    void db.load();
  }, [db.load]);

  const selectUser = useCallback((id: string) => {
    setFilterUserId((prev) => (prev === id ? null : id));
  }, []);
  const clearUser = useCallback(() => setFilterUserId(null), []);

  const dbLoad = db.load;
  const feedReload = feed.reload;
  const refresh = useCallback(async () => {
    await dbLoad(true);
    feedReload();
  }, [dbLoad, feedReload]);

  if (db.loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const scores = db.global?.actionScores;
  const scoreEntries = scores
    ? Object.entries(scores)
        .filter(([, s]) => s > 0)
        .sort(([, a], [, b]) => b - a)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 pb-24 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold">活动面板</h1>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={refresh}
          disabled={db.refreshing}
        >
          <RefreshCw
            className={cn("h-4 w-4", db.refreshing && "animate-spin")}
          />
        </Button>
      </div>

      <SummaryRow global={db.global} task={db.taskStats} />

      {db.taskStats && (
        <div className="lg:hidden">
          <TaskHeader task={db.taskStats} />
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-4 min-w-0">
          <FilterBar
            filter={filter}
            onFilter={setFilter}
            user={userProfile}
            onClearUser={clearUser}
          />
          <Feed feed={feed} onClickUser={selectUser} />
        </div>

        <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:scrollbar-none space-y-4">
          {db.taskStats && (
            <div className="hidden lg:block">
              <TaskHeader task={db.taskStats} />
            </div>
          )}

          <div className="rounded-2xl border bg-card overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 lg:cursor-default"
              onClick={() => setShowContrib((p) => !p)}
            >
              <span className="text-sm font-bold">
                贡献者排行
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  ({contributors.length})
                </span>
              </span>
              <span className="lg:hidden">
                {showContrib ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
            </button>
            <div className={cn("px-2 pb-2", !showContrib && "hidden lg:block")}>
              <Contributors
                list={contributors}
                currentUsername={username || ""}
                selectedId={filterUserId}
                onSelect={selectUser}
              />
            </div>
          </div>

          {db.tasks.length > 0 && (
            <div className="rounded-2xl border bg-card p-4 space-y-2">
              <span className="text-sm font-bold">历史任务</span>
              <div className="space-y-1">
                {db.tasks.slice(0, 5).map((t) => (
                  <button
                    key={t.taskId}
                    onClick={() => nav(`/stats/${t.taskId}`)}
                    className="w-full text-left flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted/60 transition-colors"
                  >
                    <span className="truncate">{taskName(t)}</span>
                    <span className="text-muted-foreground/50 tabular-nums shrink-0">
                      {t.totalOperations}
                    </span>
                  </button>
                ))}
              </div>
              {db.tasks.length > 5 && (
                <button
                  onClick={() => nav("/stats/history")}
                  className="text-xs text-primary hover:underline"
                >
                  查看全部 {db.tasks.length} 个 →
                </button>
              )}
            </div>
          )}

          {scoreEntries.length > 0 && (
            <div className="rounded-2xl border bg-card p-4 space-y-2">
              <span className="text-sm font-bold">积分规则</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {scoreEntries.map(([action, score]) => (
                  <div
                    key={action}
                    className="flex justify-between text-[11px] tabular-nums"
                  >
                    <span className="text-muted-foreground truncate">
                      {ACTIONS[action]?.label || action}
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      +{score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
