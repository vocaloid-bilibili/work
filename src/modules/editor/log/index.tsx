// src/modules/editor/log/index.tsx
import { useMemo, useCallback } from "react";
import { Button } from "@/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import type { EditLogEntry } from "@/core/api/collabEndpoints";
import { useLogPager } from "./useLogPager";
import LogFilters from "./LogFilters";
import LogItem from "./LogItem";
import SyncBar from "./SyncBar";
import SyncHealthPanel from "./SyncHealthPanel";

function groupByDate(logs: EditLogEntry[]) {
  const groups: { label: string; items: EditLogEntry[] }[] = [];
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const log of logs) {
    const d = new Date(log.createdAt);
    const ds = d.toDateString();
    const label =
      ds === today
        ? "今天"
        : ds === yesterday
          ? "昨天"
          : `${d.getMonth() + 1}月${d.getDate()}日`;
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(log);
    else groups.push({ label, items: [log] });
  }
  return groups;
}

export default function EditLogViewer() {
  const p = useLogPager();
  const groups = useMemo(() => groupByDate(p.data?.logs ?? []), [p.data]);
  const onCursor = useCallback(
    (c: number) => p.setSyncCursor(c),
    [p.setSyncCursor],
  );

  return (
    <div className="space-y-5">
      <LogFilters
        target={p.target}
        hasFilters={p.hasFilters}
        onTarget={p.setTarget}
        onSearch={p.applySearch}
        onReset={p.reset}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {p.data ? `${p.data.total} 条记录` : "加载中…"}
          </span>
          <SyncBar onCursorLoaded={onCursor} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={p.refresh}
          disabled={p.loading}
        >
          <RefreshCw className={`h-3 w-3 ${p.loading ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      <SyncHealthPanel onCursorLoaded={onCursor} />

      {p.loading && !p.data && (
        <div className="text-center text-muted-foreground py-16 text-sm">
          加载中…
        </div>
      )}

      {p.data && p.data.logs.length === 0 && (
        <div className="text-center text-muted-foreground py-16 text-sm">
          暂无记录
        </div>
      )}

      {groups.map((g) => (
        <div key={g.label}>
          <div className="text-xs font-semibold text-muted-foreground mb-3 sticky top-14 bg-background/90 backdrop-blur py-1 z-10">
            {g.label}
          </div>
          <div>
            {g.items.map((log) => (
              <LogItem key={log.logId} log={log} syncCursor={p.syncCursor} />
            ))}
          </div>
        </div>
      ))}

      {p.data && p.data.total > 20 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={p.page <= 1}
            onClick={p.prev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {p.page} / {p.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!p.data.hasMore}
            onClick={p.next}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
