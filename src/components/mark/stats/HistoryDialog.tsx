import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { History, FileSpreadsheet, BarChart3, Loader2 } from "lucide-react";
import type { TaskSummaryItem } from "./types";

const fmt = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loading: boolean;
  tasks: TaskSummaryItem[];
  currentTaskId: string | null;
  onDetail: (id: string) => void;
}

export default function HistoryDialog({
  open,
  onOpenChange,
  loading,
  tasks,
  currentTaskId,
  onDetail,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            历史任务
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center text-muted-foreground py-16 text-sm">
              暂无历史任务
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {tasks.map((t) => {
                const active = t.taskId === currentTaskId;
                return (
                  <div
                    key={t.taskId}
                    className={`rounded-xl border p-4 transition-colors ${active ? "border-primary/50 bg-primary/5" : "hover:bg-muted/40"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm truncate">
                            {t.fileMeta?.originalName || t.taskId.slice(0, 16)}
                          </span>
                          {active && (
                            <Badge className="text-[10px] px-1.5 py-0">
                              当前
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>{t.recordCount}条</span>
                          <span>{t.totalOperations}次操作</span>
                          <span>{t.contributorCount}人</span>
                        </div>
                        <div className="flex gap-x-4 text-[11px] text-muted-foreground/70 mt-1">
                          <span>创建 {fmt(t.createdAt)}</span>
                          {t.closedAt && <span>关闭 {fmt(t.closedAt)}</span>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => onDetail(t.taskId)}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        详情
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
