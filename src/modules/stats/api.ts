import { collabGet } from "@/core/api/collabClient";
import type {
  TaskStats,
  LogEntry,
  GlobalStats,
  TaskSummary,
} from "@/core/types/stats";

interface PagedOps {
  ops: LogEntry[];
  total: number;
  hasMore: boolean;
}
interface FilterOpts {
  userId?: string;
  category?: string;
  action?: string;
}

function qs(offset: number, limit: number, opts: FilterOpts): string {
  const p = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (opts.userId) p.set("userId", opts.userId);
  if (opts.action) p.set("action", opts.action);
  else if (opts.category) p.set("category", opts.category);
  return p.toString();
}

export const api = {
  active: () =>
    collabGet<{ taskId: string; version: number }>("/mark/tasks/active"),
  global: () => collabGet<GlobalStats>("/mark/tasks/stats/global"),
  tasks: async () =>
    (await collabGet<{ tasks: TaskSummary[] }>("/mark/tasks")).tasks || [],
  taskStats: (id: string) => collabGet<TaskStats>(`/mark/tasks/${id}/stats`),

  ops: (
    offset: number,
    limit: number,
    opts: FilterOpts & { taskId?: string } = {},
  ) => {
    const base = opts.taskId
      ? `/mark/tasks/${opts.taskId}/ops`
      : "/mark/tasks/ops/all";
    return collabGet<PagedOps>(`${base}?${qs(offset, limit, opts)}`);
  },
};

export function taskName(t: TaskSummary): string {
  return (
    t.fileMeta?.originalName?.replace(/\.(xlsx|xls)$/i, "") ||
    `任务 ${t.createdAt?.slice(0, 10) || ""}`
  );
}
