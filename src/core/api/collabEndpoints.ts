// src/core/api/collabEndpoints.ts

import { collabGet, collabPost } from "./collabClient";

// ── 编辑日志 ──

interface EditLogPayload {
  targetType: string;
  targetId: string;
  action: string;
  detail?: Record<string, unknown>;
}

export function logEdit(payload: EditLogPayload): void {
  collabPost("/mark/edit-logs", payload).catch(() => {
    console.warn("[logEdit] 日志记录失败", payload.action, payload.targetId);
  });
}

export interface EditLogEntry {
  id: number;
  logId: string;
  userId: string;
  userName: string | null;
  targetType: string;
  targetId: string;
  action: string;
  detail: Record<string, unknown> | null;
  createdAt: string;
}

export interface PagedEditLogs {
  logs: EditLogEntry[];
  total: number;
  hasMore: boolean;
}

export function getEditLogs(params?: {
  limit?: number;
  offset?: number;
  userId?: string;
  targetType?: string;
  targetId?: string;
  action?: string;
}): Promise<PagedEditLogs> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  if (params?.userId) qs.set("userId", params.userId);
  if (params?.targetType) qs.set("targetType", params.targetType);
  if (params?.targetId) qs.set("targetId", params.targetId);
  if (params?.action) qs.set("action", params.action);
  const q = qs.toString();
  return collabGet<PagedEditLogs>(`/mark/edit-logs${q ? `?${q}` : ""}`);
}

// ── 同步状态 ──

export interface SyncHealthReport {
  ok: boolean;
  checkedAt: string;
  source: string;
  windowHours: number;
  cursor: number;
  maxLogId: number;
  pendingNow: number;
  logsInWindow: number;
  lastSuccessAt: string | null;
  lastSuccessCursor: number | null;
  lastSuccessSource: string | null;
  storedHash: string | null;
  remoteHash: string | null;
  hashMatches: boolean | null;
  reasons: string[];
}

export interface SyncStatus {
  cursor: number;
  pending: number;
  maxLogId: number;
  locked: boolean;
  lockHolder: string | null;
  lockSince: string | null;

  storedHash: string | null;
  lastSuccessAt: string | null;
  lastSuccessCursor: number | null;
  lastSuccessSource: string | null;
  health: SyncHealthReport | null;
}

export function getSyncStatus(): Promise<SyncStatus> {
  return collabGet<SyncStatus>("/sync/status");
}

export function triggerSync(): Promise<{
  triggered: boolean;
  message?: string;
  result?: {
    runs: number;
    logsProcessed: number;
    deleted: number;
    bvidUpdates: number;
    nameRenames: number;
    textReplacements: number;
    newCursor: number;
    upToId: number | null;
    skippedDownloadRuns: number;
    skippedBackupRuns: number;
    timings: {
      total: number;
      download: number;
      parse: number;
      apply: number;
      write: number;
      upload: number;
      backup: number;
    };
  };
}> {
  return collabPost("/sync/trigger");
}

export function checkSync(windowHours = 24): Promise<SyncHealthReport> {
  return collabPost("/sync/check", { windowHours });
}
