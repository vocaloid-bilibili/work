// src/modules/catalog/EditLogViewer.tsx

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Badge } from "@/ui/badge";
import { Card, CardContent } from "@/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  X,
} from "lucide-react";
import {
  getEditLogs,
  type EditLogEntry,
  type PagedEditLogs,
} from "@/core/api/collabEndpoints";

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<string, string> = {
  edit_song: "编辑歌曲",
  delete_song: "删除歌曲",
  merge_song: "合并歌曲",
  edit_video: "编辑视频",
  delete_video: "删除视频",
  reassign_video: "移动视频",
  merge_artist: "合并艺人",
  set_board_video: "设置榜单视频",
};

const ACTION_COLORS: Record<string, string> = {
  edit_song: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  delete_song: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  merge_song:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  edit_video: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  delete_video: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  reassign_video:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  merge_artist:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  set_board_video:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const TARGET_LABELS: Record<string, string> = {
  song: "歌曲",
  video: "视频",
  artist: "艺人",
  ranking_video: "榜单视频",
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return iso;
  }
}

function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins} 分钟前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} 小时前`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} 天前`;
    return formatTime(iso);
  } catch {
    return iso;
  }
}

function ChangesDetail({ detail }: { detail: Record<string, unknown> | null }) {
  if (!detail) return null;

  const changes = detail.changes as
    | Record<string, { old: unknown; new: unknown }>
    | undefined;

  const name = detail.name != null ? String(detail.name) : null;
  const title = detail.title != null ? String(detail.title) : null;
  const source = detail.source as { id?: unknown; name?: unknown } | undefined;
  const target = detail.target as { id?: unknown; name?: unknown } | undefined;

  return (
    <div className="mt-2 space-y-1.5 text-xs">
      {/* 名称 / 标题 */}
      {name && (
        <div className="text-muted-foreground">
          目标：<span className="font-medium text-foreground">{name}</span>
        </div>
      )}
      {title && !name && (
        <div className="text-muted-foreground">
          标题：<span className="font-medium text-foreground">{title}</span>
        </div>
      )}

      {/* 合并信息 */}
      {source && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-red-500">
            {String(source.name ?? source.id ?? "")}
          </span>
          <span>→</span>
          <span className="text-green-600">
            {String(target?.name ?? target?.id ?? "")}
          </span>
          {detail.songsAffected != null && (
            <span className="ml-1">
              （影响 {String(detail.songsAffected)} 首）
            </span>
          )}
        </div>
      )}

      {/* 艺人类型 */}
      {detail.artistType != null && (
        <div className="text-muted-foreground">
          {"类型："}
          {detail.artistType === "vocalist"
            ? "歌手"
            : detail.artistType === "producer"
              ? "作者"
              : "引擎"}
        </div>
      )}

      {/* 视频移动 */}
      {detail.fromSongId != null &&
        (() => {
          const toSong = detail.toSong as
            | { id?: unknown; name?: unknown }
            | undefined;
          return (
            <div className="text-muted-foreground">
              {"原歌曲 ID："}
              {String(detail.fromSongId)}
              {toSong && (
                <span>
                  {" → "}
                  {String(toSong.name)} (ID: {String(toSong.id)})
                </span>
              )}
              {detail.newSongName != null && (
                <span>
                  {" → "}新歌曲「{String(detail.newSongName)}」
                </span>
              )}
            </div>
          );
        })()}

      {/* 榜单视频 */}
      {detail.board != null && detail.issue != null && (
        <div className="text-muted-foreground">
          {String(detail.board)}
          {" 第 "}
          {String(detail.issue)}
          {" 期"}
          {detail.oldBvid != null && (
            <span>
              {"："}
              {String(detail.oldBvid)}
            </span>
          )}
          {detail.newBvid != null && (
            <span>
              {" → "}
              {String(detail.newBvid)}
            </span>
          )}
        </div>
      )}

      {/* 字段变更 */}
      {changes && Object.keys(changes).length > 0 && (
        <div className="space-y-1 border-t pt-1.5 mt-1.5">
          {Object.entries(changes).map(([field, diff]) => (
            <div
              key={field}
              className="flex items-start gap-1.5 text-muted-foreground"
            >
              <span className="font-mono shrink-0">{field}:</span>
              <span className="line-through text-red-400 break-all">
                {Array.isArray(diff.old)
                  ? diff.old.join(", ")
                  : String(diff.old ?? "")}
              </span>
              <span className="shrink-0">→</span>
              <span className="text-green-600 break-all">
                {Array.isArray(diff.new)
                  ? diff.new.join(", ")
                  : String(diff.new ?? "")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LogItem({ log }: { log: EditLogEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="border rounded-lg p-3 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Badge
            variant="secondary"
            className={`text-[11px] shrink-0 ${ACTION_COLORS[log.action] || ""}`}
          >
            {ACTION_LABELS[log.action] || log.action}
          </Badge>
          <span className="text-sm font-medium truncate">
            {TARGET_LABELS[log.targetType] || log.targetType}
          </span>
          <span className="text-xs text-muted-foreground font-mono truncate">
            {log.targetId}
          </span>
        </div>
        <div className="text-right shrink-0">
          <div
            className="text-xs text-muted-foreground"
            title={formatTime(log.createdAt)}
          >
            {relativeTime(log.createdAt)}
          </div>
          <div className="text-xs text-muted-foreground">
            {log.userName || log.userId}
          </div>
        </div>
      </div>

      {expanded && log.detail && <ChangesDetail detail={log.detail} />}

      {!expanded && log.detail && (
        <div className="mt-1 text-xs text-muted-foreground/60">
          点击展开详情
        </div>
      )}
    </div>
  );
}

export default function EditLogViewer() {
  const [data, setData] = useState<PagedEditLogs | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterTargetType, setFilterTargetType] = useState<string>("all");
  const [searchUserId, setSearchUserId] = useState("");
  const [appliedUserId, setAppliedUserId] = useState("");

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const currentPage = Math.floor(page / PAGE_SIZE) + 1;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getEditLogs({
        limit: PAGE_SIZE,
        offset: page,
        action: filterAction !== "all" ? filterAction : undefined,
        targetType: filterTargetType !== "all" ? filterTargetType : undefined,
        userId: appliedUserId || undefined,
      });
      setData(result);
    } catch (e) {
      console.error("[EditLogViewer] 加载失败", e);
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterTargetType, appliedUserId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const resetFilters = () => {
    setFilterAction("all");
    setFilterTargetType("all");
    setSearchUserId("");
    setAppliedUserId("");
    setPage(0);
  };

  const hasFilters =
    filterAction !== "all" ||
    filterTargetType !== "all" ||
    appliedUserId !== "";

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-4">
      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-4 pb-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            筛选
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={resetFilters}
              >
                <X className="h-3 w-3 mr-1" />
                清除
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">操作类型</Label>
              <Select
                value={filterAction}
                onValueChange={(v) => {
                  setFilterAction(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">目标类型</Label>
              <Select
                value={filterTargetType}
                onValueChange={(v) => {
                  setFilterTargetType(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {Object.entries(TARGET_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">用户 ID</Label>
              <div className="flex gap-1">
                <Input
                  className="h-8 text-xs"
                  placeholder="输入用户 ID"
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setAppliedUserId(searchUserId.trim());
                      setPage(0);
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    setAppliedUserId(searchUserId.trim());
                    setPage(0);
                  }}
                >
                  <Search className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统计 + 刷新 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {data ? (
            <>
              共{" "}
              <span className="font-medium text-foreground">{data.total}</span>{" "}
              条记录
            </>
          ) : (
            "加载中…"
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchLogs}
          disabled={loading}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`}
          />
          刷新
        </Button>
      </div>

      {/* 日志列表 */}
      <div className="space-y-2">
        {loading && !data && (
          <div className="text-center text-muted-foreground py-12">加载中…</div>
        )}

        {data && data.logs.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            暂无操作日志
          </div>
        )}

        {data?.logs.map((log) => (
          <LogItem key={log.logId} log={log} />
        ))}
      </div>

      {/* 分页 */}
      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - PAGE_SIZE))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!data.hasMore}
            onClick={() => setPage((p) => p + PAGE_SIZE)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
