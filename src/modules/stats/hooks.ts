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

// ── Dashboard data ──

export function useDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [global, setGlobal] = useState<GlobalStats | null>(null);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
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
    } catch (e: any) {
      toast.error(e.message || "加载失败");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  return { loading, refreshing, taskStats, global, tasks, activeTaskId, load };
}

// ── Activity feed ──

export type Filter = string; // "all" | "mark" | "edit" | specific action key

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

  const fetch = useCallback(
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
      } catch (e: any) {
        toast.error(e.message || "加载失败");
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
    void fetch(0, false);
  }, [fetch]);

  return {
    ops,
    total,
    hasMore,
    loading,
    loadMore: useCallback(() => {
      if (!loading && hasMore) void fetch(ops.length, true);
    }, [fetch, loading, hasMore, ops.length]),
    reload: useCallback(() => {
      setOps([]);
      void fetch(0, false);
    }, [fetch]),
  };
}

// ── Resolve user profile from contributors ──

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
