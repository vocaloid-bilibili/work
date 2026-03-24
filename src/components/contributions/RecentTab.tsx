// src/components/contributions/RecentTab.tsx

import { useState, useCallback } from "react";
import RecentOps from "./RecentOps";
import type { TaskStats, EnrichedLogEntry } from "./types";

const PAGE_SIZE = 100;

interface Props {
  activeStats: TaskStats | null;
  fetchOps?: (
    taskId: string,
    limit: number,
    offset: number,
  ) => Promise<{ ops: EnrichedLogEntry[]; total: number; hasMore: boolean }>;
}

export default function RecentTab({ activeStats, fetchOps }: Props) {
  const [allOps, setAllOps] = useState<EnrichedLogEntry[]>(
    () => activeStats?.recentOps || [],
  );
  const [total, setTotal] = useState(allOps.length);
  const [hasMore, setHasMore] = useState(allOps.length >= 200);

  const handleLoadMore = useCallback(async () => {
    if (!fetchOps || !activeStats) return;
    const offset = allOps.length;
    const result = await fetchOps(activeStats.taskId, PAGE_SIZE, offset);
    setAllOps((prev) => [...prev, ...result.ops]);
    setTotal(result.total);
    setHasMore(result.hasMore);
  }, [fetchOps, activeStats, allOps.length]);

  if (!activeStats?.recentOps || activeStats.recentOps.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16 text-sm">
        暂无操作记录
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3 tabular-nums">
        当前任务共 {total} 条操作，已加载 {allOps.length} 条
      </p>
      <RecentOps
        ops={allOps}
        total={total}
        hasMore={hasMore}
        onLoadMore={fetchOps ? handleLoadMore : undefined}
      />
    </div>
  );
}
