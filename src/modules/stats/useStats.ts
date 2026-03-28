// src/modules/stats/useStats.ts
import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as api from "./statsApi";
import type {
  TaskStats,
  LogEntry,
  GlobalStats,
  TaskSummary,
} from "@/core/types/stats";

export function useOverview() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [task, setTask] = useState<TaskStats | null>(null);
  const [global, setGlobal] = useState<GlobalStats | null>(null);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const [a, g, ts] = await Promise.all([
        api.fetchActive(),
        api.fetchGlobal(),
        api.fetchTasks(),
      ]);
      setGlobal(g);
      setTasks(ts);
      setActiveId(a.taskId || null);
      setTask(a.taskId ? await api.fetchTaskStats(a.taskId) : null);
    } catch (e: any) {
      toast.error(e.message || "加载失败");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  return { loading, refreshing, task, global, tasks, activeId, load };
}

export interface OpsLogState {
  ops: LogEntry[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  load: (reset?: boolean) => Promise<void>;
  init: () => void;
  reset: () => void;
}

export function useOpsLog(taskId: string | null): OpsLogState {
  const [ops, setOps] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const ready = useRef(false);

  const load = useCallback(
    async (reset = false) => {
      if (!taskId) return;
      setLoading(true);
      try {
        const r = await api.fetchOps(taskId, reset ? 0 : ops.length);
        reset ? setOps(r.ops) : setOps((p) => [...p, ...r.ops]);
        setTotal(r.total);
        setHasMore(r.hasMore);
      } finally {
        setLoading(false);
      }
    },
    [taskId, ops.length],
  );

  const init = useCallback(() => {
    if (ready.current) return;
    ready.current = true;
    void load(true);
  }, [load]);

  const reset = useCallback(() => {
    ready.current = false;
    setOps([]);
    setTotal(0);
    setHasMore(false);
  }, []);

  return { ops, total, hasMore, loading, load, init, reset };
}

export function useTaskDetail(taskId?: string) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [meta, setMeta] = useState<TaskSummary | null>(null);

  const load = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const [s, ts] = await Promise.all([
        api.fetchTaskStats(taskId),
        api.fetchTasks(),
      ]);
      setStats(s);
      setMeta(ts.find((t) => t.taskId === taskId) || null);
    } catch (e: any) {
      toast.error(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  return { loading, stats, meta, load };
}

export function useBackNav(fallback: string, intercept?: () => boolean) {
  const nav = useNavigate();
  const ref = useRef(intercept);
  ref.current = intercept;

  useEffect(() => {
    const handler = () => {
      if (ref.current?.()) {
        window.history.pushState(null, "");
        return;
      }
      nav(fallback, { replace: true });
    };
    window.history.pushState(null, "");
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [nav, fallback]);
}
