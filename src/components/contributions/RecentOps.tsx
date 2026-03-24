// src/components/contributions/RecentOps.tsx

import { useState } from "react";
import { CheckCircle2, Ban, Pencil, Undo2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserAvatar from "./UserAvatar";
import { FIELD_LABELS, FIELD_COLORS } from "./constants";
import { relativeTime } from "./utils";
import type { EnrichedLogEntry } from "./types";

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

function EditDetail({ field, value }: { field: string; value: string }) {
  const label = FIELD_LABELS[field] || field;
  const color = FIELD_COLORS[field] || "text-muted-foreground";

  return (
    <p className="text-[12px] truncate mt-0.5" title={`${label} → ${value}`}>
      <span className={`font-medium ${color}`}>{label}</span>
      <span className="text-muted-foreground/50 mx-0.5">→</span>
      <span className="font-semibold text-foreground">{value}</span>
    </p>
  );
}

interface Props {
  ops: EnrichedLogEntry[];
  total?: number;
  hasMore?: boolean;
  onLoadMore?: () => Promise<void>;
}

export default function RecentOps({ ops, total, hasMore, onLoadMore }: Props) {
  const [loading, setLoading] = useState(false);

  if (ops.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10 text-sm">
        暂无操作记录
      </div>
    );
  }

  const handleLoadMore = async () => {
    if (!onLoadMore) return;
    setLoading(true);
    try {
      await onLoadMore();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-0.5">
      {ops.map((op) => {
        const name =
          op.user.nickname || op.user.username || op.user.id.slice(0, 8);
        const isEdit = op.action === "set";
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

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate shrink min-w-0">
                  {name}
                </span>
                <ActionBadge action={op.action} />
                <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-auto shrink-0 tabular-nums">
                  {relativeTime(op.at)}
                </span>
              </div>

              {isEdit && (
                <EditDetail field={op.field} value={String(op.value ?? "")} />
              )}

              {title && (
                <p
                  className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2 leading-snug"
                  title={title}
                >
                  《{title}》
                </p>
              )}
            </div>
          </div>
        );
      })}

      {hasMore && onLoadMore ? (
        <div className="flex justify-center pt-4 pb-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground gap-1.5"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {loading ? "加载中..." : "加载更多"}
          </Button>
        </div>
      ) : (
        ops.length >= 20 && (
          <div className="text-center text-[11px] text-muted-foreground/50 pt-3 pb-1 tabular-nums">
            已显示全部 {ops.length} 条
            {total !== undefined && total > ops.length && ` / 共 ${total} 条`}
          </div>
        )
      )}
    </div>
  );
}
