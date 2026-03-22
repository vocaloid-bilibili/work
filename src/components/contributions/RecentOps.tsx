// src/components/contributions/RecentOps.tsx

import { CheckCircle2, Ban, Pencil, Undo2 } from "lucide-react";
import UserAvatar from "./UserAvatar";
import type { EnrichedLogEntry } from "./types";

const FIELD_LABELS: Record<string, string> = {
  name: "歌名",
  vocal: "歌手",
  author: "作者",
  synthesizer: "引擎",
  copyright: "版权",
  type: "类别",
};

function relativeTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60_000) return "刚刚";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}分钟前`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}小时前`;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const hm = d.toLocaleString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (d.toDateString() === yesterday.toDateString()) return `昨天 ${hm}`;

    return d.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function ActionBadge({ action }: { action: string }) {
  if (action === "toggle_include")
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
        <CheckCircle2 className="h-3 w-3" />
        收录
      </span>
    );
  if (action === "blacklist")
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-red-500 dark:text-red-400 shrink-0">
        <Ban className="h-3 w-3" />
        排除
      </span>
    );
  if (action === "unblacklist")
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 shrink-0">
        <Undo2 className="h-3 w-3" />
        取消排除
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-blue-500 dark:text-blue-400 shrink-0">
      <Pencil className="h-3 w-3" />
      编辑
    </span>
  );
}

function editDetail(op: EnrichedLogEntry): string | null {
  if (op.action !== "set") return null;
  const label = FIELD_LABELS[op.field] || op.field;
  const val = String(op.value ?? "");
  return `${label} → ${val}`;
}

function toggleDetail(op: EnrichedLogEntry): string | null {
  if (op.action === "toggle_include" && op.value !== undefined) {
    return op.value ? "标记收录" : "取消收录";
  }
  return null;
}

interface Props {
  ops: EnrichedLogEntry[];
  compact?: boolean;
}

export default function RecentOps({ ops, compact = false }: Props) {
  if (ops.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10 text-sm">
        暂无操作记录
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {ops.map((op) => {
        const name =
          op.user.nickname || op.user.username || op.user.id.slice(0, 8);
        const isEdit = op.action === "set";
        const detail = editDetail(op);
        const toggle = toggleDetail(op);
        const title = op.recordTitle;

        return (
          <div
            key={op.opId}
            className="flex items-start gap-2.5 py-2 px-2 rounded-lg
                       hover:bg-muted/40 active:bg-muted/60
                       transition-colors"
          >
            <div className="shrink-0 pt-0.5">
              <UserAvatar src={op.user.avatar} name={name} size="sm" />
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate shrink min-w-0">
                  {name}
                </span>
                <ActionBadge action={op.action} />

                {isEdit && detail && (
                  <span className="text-[13px] text-foreground/80 truncate min-w-0">
                    {detail}
                  </span>
                )}

                {!isEdit && compact && title && (
                  <span className="text-[13px] text-foreground/80 truncate min-w-0">
                    《{title}》
                  </span>
                )}

                {!isEdit && !compact && toggle && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {toggle}
                  </span>
                )}

                {isEdit && compact && title && (
                  <span className="text-xs text-muted-foreground truncate min-w-0">
                    《{title}》
                  </span>
                )}

                <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-auto shrink-0">
                  {relativeTime(op.at)}
                </span>
              </div>

              {!compact && (
                <>
                  {isEdit && title && (
                    <p className="text-[13px] text-muted-foreground truncate">
                      《{title}》
                    </p>
                  )}

                  {!isEdit && title && (
                    <p className="text-[13px] text-muted-foreground truncate">
                      <span className="text-foreground/80">《{title}》</span>
                      {toggle && <span className="ml-1 text-xs">{toggle}</span>}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
