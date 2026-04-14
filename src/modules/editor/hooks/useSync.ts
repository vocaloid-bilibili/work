// src/modules/editor/hooks/useSync.ts
import { useState, useEffect, useCallback } from "react";
import {
  getSyncStatus,
  triggerSync,
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

export function useSync() {
  const [st, setSt] = useState<SyncStatus | null>(_cache);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

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

  const doSync = useCallback(async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await triggerSync();
      await _fetch();
      return r.triggered
        ? `处理 ${r.result?.logsProcessed ?? 0} 条，共 ${r.result?.runs ?? 0} 轮`
        : r.message || "无待同步";
    } catch (e) {
      const msg = e instanceof Error ? e.message : "同步失败";
      setErr(msg);
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);

  return { st, err, busy, load, doSync };
}

/** 专门给 Sync 页面用的日志加载 */
export function useSyncLogs(cursor: number | null) {
  const [logs, setLogs] = useState<EditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const pending =
    cursor != null ? logs.filter((l) => (l.id ?? l.logId ?? 0) > cursor) : [];
  const synced =
    cursor != null
      ? logs.filter((l) => (l.id ?? l.logId ?? 0) <= cursor).slice(0, 30)
      : logs.slice(0, 30);

  return { logs, pending, synced, loading, reload: loadLogs };
}
