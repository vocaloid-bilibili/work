// src/modules/stats/Timeline.tsx
import { Button } from "@/ui/button";
import {
  Loader2,
  CircleCheckBig,
  Ban,
  Undo2,
  Pencil,
  Wrench,
  GitMerge,
  Users,
  Trash2,
  ArrowRightLeft,
  Tv,
  Link2,
  Unlink,
  Plus,
} from "lucide-react";
import Avatar from "@/shared/ui/Avatar";
import { cn } from "@/ui/cn";
import { Empty } from "./statsAtoms";
import type { LogEntry } from "@/core/types/stats";
import { FIELD_LABELS } from "@/core/types/constants";

type IconType = typeof CircleCheckBig;

interface ActionDef {
  label: string;
  Icon: IconType;
  border: string;
  badge: string;
}

// ── 标注操作 ──
const MARK_ACTION: Record<string, ActionDef> = {
  toggle_include: {
    label: "收录",
    Icon: CircleCheckBig,
    border: "border-l-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  blacklist: {
    label: "排除",
    Icon: Ban,
    border: "border-l-red-400 dark:border-l-red-500",
    badge: "bg-red-500/10 text-red-500 dark:text-red-400",
  },
  unblacklist: {
    label: "取消排除",
    Icon: Undo2,
    border: "border-l-amber-400 dark:border-l-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  set: {
    label: "编辑",
    Icon: Pencil,
    border: "border-l-blue-400 dark:border-l-blue-500",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
};

// ── 运维操作 ──
const EDIT_ACTION: Record<string, ActionDef> = {
  edit_song: {
    label: "编辑歌曲",
    Icon: Pencil,
    border: "border-l-amber-400 dark:border-l-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  delete_song: {
    label: "删除歌曲",
    Icon: Trash2,
    border: "border-l-red-400 dark:border-l-red-500",
    badge: "bg-red-500/10 text-red-500 dark:text-red-400",
  },
  merge_song: {
    label: "合并歌曲",
    Icon: GitMerge,
    border: "border-l-purple-400 dark:border-l-purple-500",
    badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  edit_video: {
    label: "编辑视频",
    Icon: Pencil,
    border: "border-l-amber-400 dark:border-l-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  delete_video: {
    label: "删除视频",
    Icon: Trash2,
    border: "border-l-red-400 dark:border-l-red-500",
    badge: "bg-red-500/10 text-red-500 dark:text-red-400",
  },
  reassign_video: {
    label: "移动视频",
    Icon: ArrowRightLeft,
    border: "border-l-amber-400 dark:border-l-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  merge_artist: {
    label: "合并艺人",
    Icon: Users,
    border: "border-l-indigo-400 dark:border-l-indigo-500",
    badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  set_board_video: {
    label: "设置榜单",
    Icon: Tv,
    border: "border-l-green-400 dark:border-l-green-500",
    badge: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  add_relation: {
    label: "添加关联",
    Icon: Link2,
    border: "border-l-teal-400 dark:border-l-teal-500",
    badge: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  remove_relation: {
    label: "移除关联",
    Icon: Unlink,
    border: "border-l-orange-400 dark:border-l-orange-500",
    badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  add_video: {
    label: "添加视频",
    Icon: Plus,
    border: "border-l-blue-400 dark:border-l-blue-500",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  add_song: {
    label: "创建歌曲",
    Icon: Plus,
    border: "border-l-emerald-400 dark:border-l-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
};

const FALLBACK_ACTION: ActionDef = {
  label: "操作",
  Icon: Wrench,
  border: "border-l-zinc-400 dark:border-l-zinc-500",
  badge: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
};

function getActionDef(op: LogEntry): ActionDef {
  if (op.source === "edit") {
    return EDIT_ACTION[op.action] || FALLBACK_ACTION;
  }
  return MARK_ACTION[op.action] || FALLBACK_ACTION;
}

/** 从 edit detail 提取简洁变更摘要 */
function editValueSummary(op: LogEntry): string | null {
  if (op.source !== "edit" || !op.value) return null;
  const d = op.value as Record<string, any>;

  // 对于有 changes 的编辑操作，展示字段变更
  if (d.changes && typeof d.changes === "object") {
    return Object.entries(d.changes)
      .map(
        ([k, v]: [string, any]) =>
          `${FIELD_LABELS[k] || k}: ${v.old ?? ""} → ${v.new ?? ""}`,
      )
      .join("；");
  }

  // add_video / add_song 展示 bvid
  if (d.bvid) {
    const parts: string[] = [];
    if (d.songName) parts.push(d.songName);
    if (d.bvid) parts.push(d.bvid);
    return parts.join(" · ");
  }

  // merge 展示 source → target
  if (d.sourceName && d.targetName) {
    return `${d.sourceName} → ${d.targetName}`;
  }

  return null;
}

interface P {
  ops: LogEntry[];
  total: number;
  hasMore: boolean;
  loading?: boolean;
  onLoadMore?: () => void;
}

export default function Timeline({
  ops,
  total,
  hasMore,
  loading,
  onLoadMore,
}: P) {
  if (!ops.length && !loading) return <Empty text="暂无操作记录" />;

  const groups: { date: string; items: LogEntry[] }[] = [];
  for (const op of ops) {
    const d = op.at?.slice(0, 10) || "未知";
    const last = groups[groups.length - 1];
    if (last?.date === d) last.items.push(op);
    else groups.push({ date: d, items: [op] });
  }

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <div key={g.date}>
          <div className="flex items-center gap-3 mb-4 sticky top-14 bg-background/90 backdrop-blur py-2 z-10">
            <span className="text-sm font-bold">{g.date}</span>
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5 tabular-nums font-medium">
              {g.items.length} 条操作
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-2">
            {g.items.map((op) => {
              const a = getActionDef(op);
              const ActionIcon = a.Icon;
              const isEdit = op.source === "edit";
              const isMark = !isEdit;

              // 标注编辑的字段标签
              const markField =
                isMark && op.action === "set" && op.field
                  ? FIELD_LABELS[op.field] || op.field
                  : null;

              // 运维操作的来源标签
              const editTarget = isEdit && op.field ? op.field : null;

              // 运维操作的变更摘要
              const editSummary = editValueSummary(op);

              return (
                <div
                  key={op.opId}
                  className={cn(
                    "rounded-xl border border-l-[3px] px-4 py-3.5 transition-colors hover:bg-muted/20",
                    a.border,
                  )}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <Avatar
                      src={op.user?.avatar}
                      name={op.user?.nickname || op.user?.username || "?"}
                      size="sm"
                    />
                    <span className="text-sm font-semibold truncate">
                      {op.user?.nickname || op.user?.username || "未知"}
                    </span>
                    <div className="flex items-center gap-1.5 ml-auto shrink-0">
                      {isEdit && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          运维
                        </span>
                      )}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md",
                          a.badge,
                        )}
                      >
                        <ActionIcon className="h-3 w-3" />
                        {a.label}
                      </span>
                      {markField && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          {markField}
                        </span>
                      )}
                      {editTarget && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          {editTarget}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground/60 tabular-nums ml-1">
                        {op.at?.slice(11, 16)}
                      </span>
                    </div>
                  </div>

                  <div className="pl-9 space-y-1.5">
                    <p className="text-sm leading-relaxed line-clamp-3">
                      {isMark && op.recordIndex >= 0 && (
                        <span className="text-muted-foreground/50 font-mono text-xs mr-1.5">
                          #{op.recordIndex + 1}
                        </span>
                      )}
                      <span className="text-foreground/80">
                        {op.recordTitle || ""}
                      </span>
                    </p>

                    {/* 标注编辑的值变更 */}
                    {isMark && op.value != null && op.action === "set" && (
                      <div className="flex items-start gap-2 text-sm rounded-lg bg-muted/40 px-3 py-2">
                        <span className="text-muted-foreground/60 shrink-0 mt-px">
                          →
                        </span>
                        <span className="font-medium text-foreground/80 break-all line-clamp-2">
                          {String(op.value)}
                        </span>
                      </div>
                    )}

                    {/* 运维操作的变更摘要 */}
                    {isEdit && editSummary && (
                      <div className="flex items-start gap-2 text-sm rounded-lg bg-amber-500/5 px-3 py-2">
                        <span className="text-amber-500/60 shrink-0 mt-px">
                          →
                        </span>
                        <span className="font-medium text-foreground/80 break-all line-clamp-3">
                          {editSummary}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {loading && (
        <div className="py-6 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
        </div>
      )}

      {hasMore && onLoadMore && !loading && (
        <div className="text-center pt-2">
          <Button variant="outline" size="sm" onClick={onLoadMore}>
            加载更多（已加载 {ops.length} / 共 {total}）
          </Button>
        </div>
      )}

      {!hasMore && ops.length > 0 && (
        <p className="text-center text-xs text-muted-foreground/50 pt-2">
          共 {total} 条
        </p>
      )}
    </div>
  );
}
