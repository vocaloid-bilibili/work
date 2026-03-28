// src/modules/stats/TaskList.tsx
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { relativeTime, shortDate } from "@/core/helpers/time";
import type { TaskSummary } from "@/core/types/stats";

interface P {
  tasks: TaskSummary[];
  onDetail: (taskId: string) => void;
}

export default function TaskList({ tasks, onDetail }: P) {
  if (tasks.length === 0)
    return (
      <div className="text-center text-muted-foreground py-16 text-sm">
        暂无历史任务
      </div>
    );
  return (
    <div className="space-y-3">
      {tasks.map((t) => (
        <div
          key={t.taskId}
          className="rounded-xl border p-4 transition-colors hover:bg-muted/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm truncate">
                  {t.fileMeta?.originalName || t.taskId.slice(0, 16)}
                </span>
                {!t.closedAt && (
                  <Badge className="text-[10px] px-1.5 py-0">当前</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
                <span>{t.recordCount} 条</span>
                <span>{t.totalOperations} 次操作</span>
                <span>{t.contributorCount} 人</span>
              </div>
              <div className="flex gap-x-4 text-[11px] text-muted-foreground/70 mt-1">
                <span title={shortDate(t.createdAt)}>
                  创建 {relativeTime(t.createdAt)}
                </span>
                {t.closedAt && (
                  <span title={shortDate(t.closedAt)}>
                    关闭 {relativeTime(t.closedAt)}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => onDetail(t.taskId)}
            >
              详情
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
