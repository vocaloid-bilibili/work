// src/modules/stats/Feed.tsx
import { Loader2 } from "lucide-react";
import { Button } from "@/ui/button";
import FeedItem from "./FeedItem";
import type { FeedState } from "./hooks";
import type { LogEntry } from "@/core/types/stats";

interface P {
  feed: FeedState;
  onClickUser: (userId: string) => void;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const wd = WEEKDAYS[d.getDay()];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = (today.getTime() - target.getTime()) / 86400000;

    if (diff === 0) return "今天";
    if (diff === 1) return "昨天";
    if (diff === 2) return "前天";
    if (d.getFullYear() === now.getFullYear()) return `${m}月${day}日 周${wd}`;
    return `${d.getFullYear()}年${m}月${day}日`;
  } catch {
    return iso;
  }
}

export default function Feed({ feed, onClickUser }: P) {
  const { ops, total, hasMore, loading, loadMore } = feed;

  if (!ops.length && !loading) {
    return (
      <p className="text-center text-sm text-muted-foreground py-16">
        暂无操作记录
      </p>
    );
  }

  const groups: { date: string; dateRaw: string; items: LogEntry[] }[] = [];
  for (const op of ops) {
    const raw = op.at?.slice(0, 10) || "未知";
    const last = groups[groups.length - 1];
    if (last?.dateRaw === raw) last.items.push(op);
    else groups.push({ date: formatDate(raw), dateRaw: raw, items: [op] });
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.dateRaw}>
          <div className="flex items-center gap-3 mb-2 sticky top-14 bg-background/90 backdrop-blur-sm py-1.5 z-10">
            <span className="text-xs font-bold text-muted-foreground">
              {g.date}
            </span>
            <span className="text-[10px] text-muted-foreground/50 bg-muted rounded px-1.5 py-0.5 tabular-nums">
              {g.items.length}
            </span>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <div className="space-y-1.5">
            {g.items.map((op) => (
              <FeedItem key={op.opId} op={op} onClickUser={onClickUser} />
            ))}
          </div>
        </div>
      ))}

      {loading && (
        <div className="py-8 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground/40" />
        </div>
      )}

      {hasMore && !loading && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMore}
            className="text-xs text-muted-foreground"
          >
            加载更多 · {ops.length}/{total}
          </Button>
        </div>
      )}

      {!hasMore && ops.length > 0 && (
        <p className="text-center text-[11px] text-muted-foreground/40 pt-2">
          共 {total} 条
        </p>
      )}
    </div>
  );
}
