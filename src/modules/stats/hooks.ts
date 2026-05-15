// src/modules/stats/hooks.ts
import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { api } from "./api";
import type {
  TaskStats,
  LogEntry,
  GlobalStats,
  TaskSummary,
  UserProfile,
} from "@/core/types/stats";

export function useDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [global, setGlobal] = useState<GlobalStats | null>(null);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [a, g, ts] = await Promise.all([
        api.active(),
        api.global(),
        api.tasks(),
      ]);
      setGlobal(g);
      setTasks(ts);
      setActiveTaskId(a.taskId || null);
      setTaskStats(a.taskId ? await api.taskStats(a.taskId) : null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  return { loading, refreshing, taskStats, global, tasks, activeTaskId, load };
}

export type Filter = string;

function filterToApi(f: Filter): { category?: string; action?: string } {
  if (f === "all") return {};
  if (f === "mark" || f === "edit") return { category: f };
  return { action: f };
}

export interface FeedState {
  ops: LogEntry[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  loadMore: () => void;
  reload: () => void;
}

export function useFeed(
  taskId: string | null,
  userId: string | null,
  filter: Filter,
): FeedState {
  const [ops, setOps] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const doFetch = useCallback(
    async (offset: number, append: boolean) => {
      setLoading(true);
      try {
        const r = await api.ops(offset, 100, {
          taskId: taskId || undefined,
          userId: userId || undefined,
          ...filterToApi(filter),
        });
        setOps((prev) => (append ? [...prev, ...r.ops] : r.ops));
        setTotal(r.total);
        setHasMore(r.hasMore);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "加载失败");
      } finally {
        setLoading(false);
      }
    },
    [taskId, userId, filter],
  );

  useEffect(() => {
    setOps([]);
    setTotal(0);
    setHasMore(false);
    void doFetch(0, false);
  }, [doFetch]);

  return {
    ops,
    total,
    hasMore,
    loading,
    loadMore: useCallback(() => {
      if (!loading && hasMore) void doFetch(ops.length, true);
    }, [doFetch, loading, hasMore, ops.length]),
    reload: useCallback(() => {
      setOps([]);
      void doFetch(0, false);
    }, [doFetch]),
  };
}

export function useUserProfile(
  userId: string | null,
  contributors: { user: UserProfile }[],
): UserProfile | null {
  return useMemo(
    () =>
      userId
        ? (contributors.find((c) => c.user.id === userId)?.user ?? null)
        : null,
    [userId, contributors],
  );
}
