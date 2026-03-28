// src/modules/stats/DetailDialog.tsx
import { useState, useCallback } from "react";
import { Separator } from "@/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/ui/dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/ui/cn";
import TabNav from "@/shared/ui/TabNav";
import StatsCards from "./StatsCards";
import RatioBar from "./RatioBar";
import ContributorList from "./ContributorList";
import FieldBreakdown from "./FieldBreakdown";
import RecentOps from "./RecentOps";
import type { TaskStats, LogEntry } from "@/core/types/stats";

interface P {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loading: boolean;
  stats: TaskStats | null;
  fetchOps?: (
    taskId: string,
    limit: number,
    offset: number,
  ) => Promise<{ ops: LogEntry[]; total: number; hasMore: boolean }>;
}

type Tab = "overview" | "ops";

export default function DetailDialog({
  open,
  onOpenChange,
  loading,
  stats,
  fetchOps,
}: P) {
  const [tab, setTab] = useState<Tab>("overview");
  const [ops, setOps] = useState<LogEntry[]>([]);
  const [opsTotal, setOpsTotal] = useState(0);
  const [opsMore, setOpsMore] = useState(false);
  const [opsInit, setOpsInit] = useState(false);

  const onTab = useCallback(
    (k: Tab) => {
      setTab(k);
      if (k === "ops" && !opsInit && stats) {
        const init = stats.recentOps || [];
        setOps(init);
        setOpsMore(init.length >= 200);
        setOpsTotal(init.length);
        setOpsInit(true);
      }
    },
    [opsInit, stats],
  );

  const loadMore = useCallback(async () => {
    if (!fetchOps || !stats) return;
    const r = await fetchOps(stats.taskId, 100, ops.length);
    setOps((p) => [...p, ...r.ops]);
    setOpsTotal(r.total);
    setOpsMore(r.hasMore);
  }, [fetchOps, stats, ops.length]);

  const toggle = useCallback(
    (v: boolean) => {
      onOpenChange(v);
      if (!v) {
        setOpsInit(false);
        setOps([]);
        setOpsTotal(0);
        setOpsMore(false);
        setTab("overview");
      }
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={toggle}>
      <DialogContent
        className={cn(
          "max-w-lg p-0 flex flex-col gap-0 overflow-hidden h-[90dvh] sm:h-auto sm:max-h-[85vh]",
        )}
      >
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 shrink-0">
          <DialogTitle>任务详细统计</DialogTitle>
          <DialogDescription className="sr-only">
            查看任务的统计信息和操作记录
          </DialogDescription>
        </DialogHeader>
        <div className="px-4 sm:px-6 shrink-0">
          <TabNav
            tabs={[
              { key: "overview" as const, label: "概览 & 贡献" },
              { key: "ops" as const, label: "操作记录" },
            ]}
            active={tab}
            onChange={onTab}
          />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="px-4 sm:px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
            ) : stats ? (
              <>
                {tab === "overview" && (
                  <div className="space-y-5 pt-3">
                    <StatsCards stats={stats} />
                    <RatioBar
                      recordCount={stats.recordCount}
                      totalIncluded={stats.totalIncluded}
                      totalBlacklisted={stats.totalBlacklisted}
                    />
                    <Separator />
                    <ContributorList
                      contributors={stats.contributors}
                      totalOps={stats.totalOperations}
                    />
                    <FieldBreakdown breakdown={stats.fieldBreakdown} />
                  </div>
                )}
                {tab === "ops" && (
                  <div className="pt-3">
                    <h3 className="text-sm font-semibold mb-3">
                      操作记录{" "}
                      <span className="text-muted-foreground font-normal ml-1 tabular-nums">
                        ({ops.length}
                        {opsTotal > ops.length && ` / ${opsTotal}`} 条)
                      </span>
                    </h3>
                    <RecentOps
                      ops={ops}
                      total={opsTotal}
                      hasMore={opsMore}
                      onLoadMore={fetchOps ? loadMore : undefined}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-16 text-sm">
                无数据
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
