// src/modules/editor/hooks/useSync.ts
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getSyncStatus,
  triggerSync,
  checkSync,
  getEditLogs,
  type SyncStatus,
  type EditLogEntry,
} from "@/core/api/collabEndpoints";

let _cache: SyncStatus | null = null;
const _listeners = new Set<(st: SyncStatus | null) => void>();
let _timer: ReturnType<typeof setInterval> | null = null;

async function _fetch() {
  try {
    const d = await getSyncStatus();
    _cache = d;
    _listeners.forEach((fn) => fn(d));
    return d;
  } catch {
    return null;
  }
}

function _startPolling() {
  if (_timer) return;
  _fetch();
  _timer = setInterval(_fetch, 15_000);
}

function _stopPollingIfEmpty() {
  if (_listeners.size === 0 && _timer) {
    clearInterval(_timer);
    _timer = null;
  }
}

/* ── useSync：带基线对比 ── */

export function useSync() {
  const [st, setSt] = useState<SyncStatus | null>(_cache);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const fn = (d: SyncStatus | null) => {
      if (d) setSt(d);
    };
    _listeners.add(fn);
    _startPolling();
    if (_cache) setSt(_cache);
    return () => {
      _listeners.delete(fn);
      _stopPollingIfEmpty();
    };
  }, []);

  const load = useCallback(async () => {
    const d = await _fetch();
    if (!d) setErr("加载失败");
    else setErr("");
    return d;
  }, []);

  const verify = useCallback(async () => {
    setChecking(true);
    setErr("");
    try {
      await checkSync();
      const d = await _fetch();
      if (!d) setErr("加载失败");
      return d;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "校验失败");
      return null;
    } finally {
      setChecking(false);
    }
  }, []);

  const doSync = useCallback(async () => {
    setBusy(true);
    setErr("");

    const baseline = _cache;
    const cursorBefore = baseline?.cursor ?? 0;

    try {
      const r = await triggerSync();
      const after = await _fetch();

      if (!r.triggered) {
        return r.message || "无待同步";
      }

      const cursorAfter = after?.cursor ?? cursorBefore;
      const advanced = cursorAfter - cursorBefore;
      const health = after?.health;

      if (health && !health.hashMatches) {
        setErr("同步已执行，但本地与远端数据不一致");
        return "同步完成但哈希不匹配";
      }

      const parts: string[] = [];
      if (r.result?.logsProcessed)
        parts.push(`处理 ${r.result.logsProcessed} 条`);
      if (advanced > 0) parts.push(`推进 ${advanced} 条`);
      if (after?.pending === 0 && health?.hashMatches) {
        parts.push("已全部同步 ✓");
      } else if ((after?.pending ?? 0) > 0) {
        parts.push(`剩余 ${after!.pending} 条待同步`);
      }

      return parts.join("，") || "同步完成";
    } catch (e) {
      const msg = e instanceof Error ? e.message : "同步失败";
      setErr(msg);
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);

  return { st, err, busy, checking, load, verify, doSync };
}

/* ── useSyncLogs：cursor 变化时自动刷新 ── */

export function useSyncLogs(cursor: number | null) {
  const [logs, setLogs] = useState<EditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const prevCursorRef = useRef<number | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getEditLogs({ limit: 300, offset: 0 });
      setLogs(r.logs ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // cursor 变化时自动重新加载日志
  useEffect(() => {
    if (prevCursorRef.current !== null && cursor !== prevCursorRef.current) {
      loadLogs();
    }
    prevCursorRef.current = cursor;
  }, [cursor, loadLogs]);

  const pending =
    cursor != null ? logs.filter((l) => (l.id ?? l.logId ?? 0) > cursor) : [];
  const synced =
    cursor != null
      ? logs.filter((l) => (l.id ?? l.logId ?? 0) <= cursor).slice(0, 30)
      : logs.slice(0, 30);

  return { logs, pending, synced, loading, reload: loadLogs };
}
