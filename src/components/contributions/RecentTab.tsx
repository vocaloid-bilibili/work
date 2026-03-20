// src/components/contributions/RecentTab.tsx
import RecentOps from "./RecentOps";
import type { TaskStats } from "./types";

interface Props {
  activeStats: TaskStats | null;
}

export default function RecentTab({ activeStats }: Props) {
  if (!activeStats?.recentOps || activeStats.recentOps.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16 text-sm">
        暂无操作记录
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">
        当前任务最近 {activeStats.recentOps.length} 条操作
      </p>
      <RecentOps ops={activeStats.recentOps} />
    </div>
  );
}
