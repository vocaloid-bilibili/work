// src/modules/stats/statsApi.ts
import { collabGet } from "@/core/api/collabClient";
import type {
  TaskStats,
  LogEntry,
  GlobalStats,
  TaskSummary,
} from "@/core/types/stats";

export async function fetchActive() {
  return collabGet<{ taskId: string; version: number }>("/mark/tasks/active");
}

export async function fetchGlobal() {
  return collabGet<GlobalStats>("/mark/tasks/stats/global");
}

export async function fetchTasks() {
  const r = await collabGet<{ tasks: TaskSummary[] }>("/mark/tasks");
  return r.tasks || [];
}

export async function fetchTaskStats(taskId: string) {
  return collabGet<TaskStats>(`/mark/tasks/${taskId}/stats`);
}

export async function fetchOps(taskId: string, offset: number, limit = 100) {
  return collabGet<{ ops: LogEntry[]; total: number; hasMore: boolean }>(
    `/mark/tasks/${taskId}/ops?limit=${limit}&offset=${offset}`,
  );
}

export function taskName(t: TaskSummary): string {
  return (
    t.fileMeta?.originalName?.replace(/\.(xlsx|xls)$/i, "") ||
    `任务 ${t.createdAt?.slice(0, 10) || ""}`
  );
}
