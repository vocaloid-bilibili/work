// src/modules/editor/views/Sync.tsx
import { useState } from "react";
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  ChevronDown,
  Pencil,
  Trash2,
  GitMerge,
  Users,
  ArrowRightLeft,
  Plus,
  Tv,
  Link2,
  Unlink,
  Wrench,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/ui/cn";
import { useSync, useSyncLogs } from "../hooks/useSync";
import { Btn } from "../components/Btn";
import { fmtTimeAgo, fmtShort } from "../utils/fmt";
import type { EditLogEntry } from "@/core/api/collabEndpoints";

/* ── 操作图标和标签 ── */

const ACTION_META: Record<
  string,
  { label: string; icon: typeof Wrench; color: string }
> = {
  edit_song: { label: "编辑歌曲", icon: Pencil, color: "text-blue-600" },
  edit_video: { label: "编辑视频", icon: Pencil, color: "text-cyan-600" },
  delete_song: { label: "彻底删除歌曲", icon: Trash2, color: "text-red-600" },
  delete_video: { label: "停止收录视频", icon: Trash2, color: "text-red-600" },
  restore_video: {
    label: "恢复收录视频",
    icon: RotateCcw,
    color: "text-emerald-600",
  },
  merge_song: { label: "合并歌曲", icon: GitMerge, color: "text-purple-600" },
  merge_artist: { label: "合并艺人", icon: Users, color: "text-fuchsia-600" },
  reassign_video: {
    label: "移动视频",
    icon: ArrowRightLeft,
    color: "text-amber-600",
  },
  add_song: { label: "创建歌曲", icon: Plus, color: "text-green-600" },
  add_video: { label: "添加视频", icon: Plus, color: "text-teal-600" },
  add_relation: { label: "添加关联", icon: Link2, color: "text-cyan-600" },
  remove_relation: {
    label: "移除关联",
    icon: Unlink,
    color: "text-orange-600",
  },
  set_board_video: { label: "设置榜单", icon: Tv, color: "text-blue-600" },
};

function getMeta(action: string) {
  return (
    ACTION_META[action] ?? {
      label: action,
      icon: Wrench,
      color: "text-foreground",
    }
  );
}

/* ── 日志描述 ── */

function describe(log: EditLogEntry): string {
  const d = (log.detail ?? {}) as Record<string, any>;
  const name = d.songName || d.title || d.newSongName || d.newArtistName || "";

  switch (log.action) {
    case "edit_song":
      return name ? `编辑「${name}」` : "编辑歌曲";
    case "edit_video":
      return `编辑视频 ${d.bvid || ""}`;
    case "delete_song":
      return name ? `彻底删除「${name}」` : "彻底删除歌曲";
    case "delete_video":
      return `停止收录 ${d.bvid || ""}`;
    case "restore_video":
      return `恢复收录 ${d.bvid || ""}`;
    case "add_song":
      return name ? `创建「${name}」` : "创建歌曲";
    case "add_video":
      return `添加视频到「${d.songName || ""}」`;
    case "merge_song": {
      const src = (d.source as any)?.name;
      const tgt = (d.target as any)?.name || d.newSongName;
      return `合并「${src || "?"}」→「${tgt || "?"}」`;
    }
    case "merge_artist": {
      const src = (d.source as any)?.name;
      const tgt = (d.target as any)?.name || d.newArtistName;
      return `合并艺人「${src || "?"}」→「${tgt || "?"}」`;
    }
    case "reassign_video":
      return `移动视频 ${d.bvid || ""}`;
    case "set_board_video":
      return `设置${d.boardName || ""}第${d.issue || ""}期`;
    case "add_relation":
      return `添加「${name}」的关联`;
    case "remove_relation":
      return `移除「${name}」的关联`;
    default:
      return name || log.action;
  }
}

/* ── 单条日志行 ── */

function LogRow({ log, isPending }: { log: EditLogEntry; isPending: boolean }) {
  const meta = getMeta(log.action);
  const Icon = meta.icon;
  const user = log.userName || log.userId || "未知";
  const time = log.createdAt;

  return (
    <div className="flex items-start gap-2.5 sm:gap-3 px-3 sm:px-4 py-3">
      <div className={cn("mt-0.5 shrink-0", meta.color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{describe(log)}</span>
          {isPending && (
            <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
              待同步
            </span>
          )}
        </div>
        <div className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
          <span>{user}</span>
          <span>·</span>
          <span title={fmtShort(time)}>{fmtTimeAgo(time)}</span>
          {log.targetId && (
            <>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline font-mono truncate max-w-40">
                {log.targetId}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 主页面 ── */

export function SyncView() {
  const { st, err, busy, load, doSync } = useSync();
  const {
    pending,
    synced,
    loading: logsLoading,
    reload,
  } = useSyncLogs(st?.cursor ?? null);
  const [showSynced, setShowSynced] = useState(false);

  const handleSync = async () => {
    try {
      const msg = await doSync();
      await reload();
      toast.success(msg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "同步失败");
    }
  };

  const handleRefresh = async () => {
    await load();
    await reload();
  };

  const health = st?.health;
  const hasErr = health && !health.ok;
  const hasPending = !!st && st.pending > 0;
  const isOk = !!st && !hasErr && !hasPending;

  return (
    <div className="space-y-6">
      {/* ── 状态横幅 ── */}
      {st && (
        <div
          className={cn(
            "rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
            hasErr
              ? "bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800"
              : hasPending
                ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800"
                : "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800",
          )}
        >
          <div className="flex items-start gap-3 min-w-0">
            {hasErr ? (
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 shrink-0 mt-0.5" />
            ) : hasPending ? (
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm sm:text-base font-bold",
                  hasErr
                    ? "text-red-800 dark:text-red-200"
                    : hasPending
                      ? "text-amber-800 dark:text-amber-200"
                      : "text-emerald-800 dark:text-emerald-200",
                )}
              >
                {hasErr
                  ? "同步异常"
                  : hasPending
                    ? `${st.pending} 条操作待同步`
                    : "已全部同步"}
              </p>

              {hasErr && health.reasons?.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {health.reasons.map((r, i) => (
                    <p
                      key={i}
                      className="text-xs sm:text-sm text-red-700 dark:text-red-300 break-all"
                    >
                      {r}
                    </p>
                  ))}
                </div>
              )}

              {!hasErr && hasPending && (
                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 mt-1">
                  已记录，等待推送到主数据库
                  {st.lastSuccessAt && (
                    <span className="block sm:inline sm:ml-1">
                      · 上次同步 {fmtTimeAgo(st.lastSuccessAt)}
                    </span>
                  )}
                </p>
              )}

              {isOk && st.lastSuccessAt && (
                <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                  上次同步 {fmtTimeAgo(st.lastSuccessAt)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Btn
              className="flex-1 sm:flex-initial"
              onClick={handleRefresh}
              disabled={busy || logsLoading}
              loading={logsLoading}
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              size="sm"
            >
              刷新
            </Btn>
            <Btn
              className="flex-1 sm:flex-initial"
              variant="primary"
              size="sm"
              onClick={handleSync}
              disabled={busy || !!st?.locked}
              loading={busy}
              icon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              立即同步
            </Btn>
          </div>
        </div>
      )}

      {!st && !err && (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" /> 加载中…
        </div>
      )}

      {err && <p className="text-sm text-red-600 text-center py-8">{err}</p>}

      {/* ── 待同步日志 ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">
            待同步
            {pending.length > 0 && (
              <span className="ml-1.5 text-amber-600">({pending.length})</span>
            )}
          </h3>
        </div>

        {logsLoading && pending.length === 0 && (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> 加载日志…
          </div>
        )}

        {!logsLoading && pending.length === 0 && (
          <div className="text-center py-8 rounded-2xl border bg-card">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">无待同步操作</p>
          </div>
        )}

        {pending.length > 0 && (
          <div className="rounded-2xl border bg-card divide-y divide-border overflow-hidden">
            {pending.map((log) => (
              <LogRow key={log.id ?? log.logId} log={log} isPending={true} />
            ))}
          </div>
        )}
      </div>

      {/* ── 已同步日志 ── */}
      {synced.length > 0 && (
        <div>
          <button
            onClick={() => setShowSynced((v) => !v)}
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                showSynced && "rotate-180",
              )}
            />
            最近已同步（{synced.length}）
          </button>

          {showSynced && (
            <div className="rounded-2xl border bg-card divide-y divide-border overflow-hidden opacity-70">
              {synced.map((log) => (
                <LogRow key={log.id ?? log.logId} log={log} isPending={false} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 概览数字 ── */}
      {st && (
        <div className="rounded-2xl border bg-card p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-black tabular-nums">
                {st.pending}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
                待同步
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black tabular-nums">
                {st.cursor}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
                已同步
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black tabular-nums">
                {st.maxLogId}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
                总日志
              </p>
            </div>
            <div>
              <p
                className={cn(
                  "text-2xl sm:text-3xl font-black",
                  health?.ok
                    ? "text-emerald-600"
                    : health
                      ? "text-red-600"
                      : "text-muted-foreground",
                )}
              >
                {health ? (health.ok ? "✓" : "✗") : "—"}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
                健康
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
