import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BarChart3, History, Users, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import StatsOverview from "./stats/StatsOverview";
import ContributorList from "./stats/ContributorList";
import FieldBreakdown from "./stats/FieldBreakdown";
import HistoryDialog from "./stats/HistoryDialog";
import DetailDialog from "./stats/DetailDialog";
import type { TaskStats, TaskSummaryItem } from "./stats/types";

interface Props {
  currentTaskId: string | null;
  fetchTaskStats: (taskId?: string) => Promise<TaskStats>;
  fetchTaskList: () => Promise<{ tasks: TaskSummaryItem[] }>;
}

export default function TaskStatsPanel({
  currentTaskId,
  fetchTaskStats,
  fetchTaskList,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [currentStats, setCurrentStats] = useState<TaskStats | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [taskList, setTaskList] = useState<TaskSummaryItem[]>([]);
  const [detailStats, setDetailStats] = useState<TaskStats | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadStats = useCallback(async () => {
    if (!currentTaskId) return;
    setStatsLoading(true);
    try {
      setCurrentStats(await fetchTaskStats(currentTaskId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "加载失败");
    } finally {
      setStatsLoading(false);
    }
  }, [currentTaskId, fetchTaskStats]);

  useEffect(() => {
    if (sheetOpen && currentTaskId) void loadStats();
  }, [sheetOpen, currentTaskId, loadStats]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      setTaskList((await fetchTaskList()).tasks);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "加载失败");
    } finally {
      setHistoryLoading(false);
    }
  }, [fetchTaskList]);

  const loadDetail = useCallback(
    async (id: string) => {
      setDetailLoading(true);
      setDetailOpen(true);
      try {
        setDetailStats(await fetchTaskStats(id));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "加载失败");
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchTaskStats],
  );

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            统计
          </Button>
        </SheetTrigger>
        <SheetContent className="w-95 sm:w-110 p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                任务统计
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={loadStats}
                disabled={statsLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${statsLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 px-6">
            {statsLoading && !currentStats ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            ) : currentStats ? (
              <div className="space-y-6 pb-6">
                <StatsOverview stats={currentStats} />
                <Separator />
                <ContributorList stats={currentStats} />
                <FieldBreakdown breakdown={currentStats.fieldBreakdown} />
                <Separator />
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    setHistoryOpen(true);
                    void loadHistory();
                  }}
                >
                  <History className="h-4 w-4" />
                  查看历史任务
                </Button>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-20 text-sm">
                {currentTaskId ? "点击刷新" : "暂无活跃任务"}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
      <HistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        loading={historyLoading}
        tasks={taskList}
        currentTaskId={currentTaskId}
        onDetail={loadDetail}
      />
      <DetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        loading={detailLoading}
        stats={detailStats}
      />
    </>
  );
}
