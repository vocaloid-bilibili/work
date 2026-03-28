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

export type OpsScope = "task" | "global";

export interface OpsLogState {
  ops: LogEntry[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  scope: OpsScope;
  filterUserId: string | null;
  load: (
    reset?: boolean,
    overrideScope?: OpsScope,
    overrideUserId?: string | null,
  ) => Promise<void>;
  init: (forceScope?: OpsScope, userId?: string | null) => void;
  setFilterUser: (userId: string | null) => void;
  reset: () => void;
}

export function useOpsLog(taskId: string | null): OpsLogState {
  const [ops, setOps] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<OpsScope>("task");
  const [filterUserId, setFilterUserId] = useState<string | null>(null);

  const scopeRef = useRef<OpsScope>("task");
  const opsRef = useRef(ops);
  const userRef = useRef<string | null>(null);
  const ready = useRef(false);

  scopeRef.current = scope;
  opsRef.current = ops;
  userRef.current = filterUserId;

  const load = useCallback(
    async (
      reset = false,
      overrideScope?: OpsScope,
      overrideUserId?: string | null,
    ) => {
      const s = overrideScope ?? scopeRef.current;
      const uid =
        overrideUserId !== undefined ? overrideUserId : userRef.current;
      if (s === "task" && !taskId) return;
      setLoading(true);
      try {
        const offset = reset ? 0 : opsRef.current.length;
        const r =
          s === "global"
            ? await api.fetchGlobalOps(offset, 100, uid || undefined)
            : await api.fetchOps(taskId!, offset, 100, uid || undefined);
        reset ? setOps(r.ops) : setOps((p) => [...p, ...r.ops]);
        setTotal(r.total);
        setHasMore(r.hasMore);
      } finally {
        setLoading(false);
      }
    },
    [taskId],
  );

  const init = useCallback(
    (forceScope?: OpsScope, userId?: string | null) => {
      const target = forceScope ?? scopeRef.current;
      const uid = userId !== undefined ? userId : userRef.current;

      const scopeChanged = target !== scopeRef.current;
      const userChanged = uid !== userRef.current;

      if (scopeChanged || userChanged) {
        scopeRef.current = target;
        setScope(target);
        userRef.current = uid;
        setFilterUserId(uid);
        ready.current = false;
        setOps([]);
        setTotal(0);
        setHasMore(false);
      }

      if (ready.current) return;
      ready.current = true;
      void load(true, target, uid);
    },
    [load],
  );

  const setFilterUser = useCallback(
    (userId: string | null) => {
      if (userId === userRef.current) return;
      userRef.current = userId;
      setFilterUserId(userId);
      setOps([]);
      setTotal(0);
      setHasMore(false);
      ready.current = true;
      void load(true, scopeRef.current, userId);
    },
    [load],
  );

  const reset = useCallback(() => {
    ready.current = false;
    scopeRef.current = "task";
    userRef.current = null;
    setScope("task");
    setFilterUserId(null);
    setOps([]);
    setTotal(0);
    setHasMore(false);
  }, []);

  return {
    ops,
    total,
    hasMore,
    loading,
    scope,
    filterUserId,
    load,
    init,
    setFilterUser,
    reset,
  };
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
