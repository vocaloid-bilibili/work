// src/modules/editor/log/SyncHealthPanel.tsx
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  Lock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/ui/button";
import {
  checkSync,
  getSyncStatus,
  triggerSync,
  type SyncStatus,
} from "@/core/api/collabEndpoints";
import { formatTime } from "./utils";

interface Props {
  onCursorLoaded?: (cursor: number) => void;
}

function shortHash(v: string | null | undefined): string {
  return v ? `${v.slice(0, 8)}…` : "—";
}

export default function SyncHealthPanel({ onCursorLoaded }: Props) {
  const [st, setSt] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await getSyncStatus();
      setSt(data);
      onCursorLoaded?.(data.cursor);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [onCursorLoaded]);

  useEffect(() => {
    void load();
  }, [load]);

  const doCheck = async () => {
    setChecking(true);
    setMsg("");
    setErr("");
    try {
      await checkSync(48);
      await load();
      setMsg("已完成最近 48 小时同步检查");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "检查失败");
    } finally {
      setChecking(false);
    }
  };

  const doSync = async () => {
    setSyncing(true);
    setMsg("");
    setErr("");
    try {
      const res = await triggerSync();
      await load();
      if (res.triggered) {
        setMsg(
          `同步完成：处理 ${res.result?.logsProcessed ?? 0} 条日志，共 ${res.result?.runs ?? 0} 轮`,
        );
      } else {
        setMsg(res.message || "无待同步日志");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "同步失败");
    } finally {
      setSyncing(false);
    }
  };

  const health = st?.health ?? null;
  const apparentSynced = !!st && st.pending === 0;
  const realHealthy = health?.ok ?? null;
  const fakeSynced = apparentSynced && realHealthy === false;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-medium">同步健康检查</div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading || checking || syncing}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            刷新状态
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={doCheck}
            disabled={loading || checking || syncing}
          >
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Clock3 className="h-4 w-4" />
            )}
            手动检查
          </Button>

          <Button
            size="sm"
            onClick={doSync}
            disabled={loading || checking || syncing || st?.locked}
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            立即同步
          </Button>
        </div>
      </div>

      {st?.locked && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <Lock className="h-4 w-4" />
          同步锁已占用
          {st.lockHolder ? `（${st.lockHolder}）` : ""}
        </div>
      )}

      {fakeSynced ? (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          账面上已同步，但实际检查异常
        </div>
      ) : apparentSynced && realHealthy === true ? (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          当前已同步，且最近 48 小时检查正常
        </div>
      ) : st ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock3 className="h-4 w-4" />
          当前有 {st.pending} 条待同步日志
        </div>
      ) : null}

      {(msg || err) && (
        <div
          className={`text-sm ${err ? "text-red-600" : "text-muted-foreground"}`}
        >
          {err || msg}
        </div>
      )}

      {!st && loading && (
        <div className="text-sm text-muted-foreground">加载中…</div>
      )}

      {st && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border p-3 space-y-2">
            <div className="font-medium">当前状态</div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">同步游标</span>
              <span className="tabular-nums">
                {st.cursor} / {st.maxLogId}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">当前待同步</span>
              <span className="tabular-nums">{st.pending}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">本地记录基线</span>
              <span className="font-mono">{shortHash(st.storedHash)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">最近成功同步</span>
              <span>
                {st.lastSuccessAt ? formatTime(st.lastSuccessAt) : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">成功来源</span>
              <span>{st.lastSuccessSource || "—"}</span>
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <div className="font-medium">最近健康检查</div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">检查时间</span>
              <span>
                {health?.checkedAt ? formatTime(health.checkedAt) : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">检查来源</span>
              <span>{health?.source || "—"}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">检查窗口内日志数</span>
              <span className="tabular-nums">
                {health?.logsInWindow ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">远端实际基线</span>
              <span className="font-mono">{shortHash(health?.remoteHash)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">哈希一致性</span>
              <span>
                {health?.hashMatches == null
                  ? "—"
                  : health.hashMatches
                    ? "一致"
                    : "不一致"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">检查结论</span>
              <span
                className={
                  health?.ok ? "text-green-600" : health ? "text-red-600" : ""
                }
              >
                {health ? (health.ok ? "正常" : "异常") : "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      {!!health?.reasons?.length && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-3">
          <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
            异常原因
          </div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-red-700 dark:text-red-300">
            {health.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
