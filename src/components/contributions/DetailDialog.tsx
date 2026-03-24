// src/components/contributions/DetailDialog.tsx

import { useState, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import StatsCards from "./StatsCards";
import RatioBar from "./RatioBar";
import ContributorList from "./ContributorList";
import FieldBreakdown from "./FieldBreakdown";
import RecentOps from "./RecentOps";
import type { TaskStats, EnrichedLogEntry } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loading: boolean;
  stats: TaskStats | null;
  /** 加载更多操作记录 */
  fetchOps?: (
    taskId: string,
    limit: number,
    offset: number,
  ) => Promise<{
    ops: EnrichedLogEntry[];
    total: number;
    hasMore: boolean;
  }>;
}

type TabKey = "overview" | "ops";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "概览 & 贡献" },
  { key: "ops", label: "操作记录" },
];

const PAGE_SIZE = 100;

export default function DetailDialog({
  open,
  onOpenChange,
  loading,
  stats,
  fetchOps,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // 分页操作记录状态
  const [allOps, setAllOps] = useState<EnrichedLogEntry[]>([]);
  const [opsTotal, setOpsTotal] = useState(0);
  const [opsHasMore, setOpsHasMore] = useState(false);
  const [opsInited, setOpsInited] = useState(false);

  // 切换到操作记录 tab 时，用 stats.recentOps 做初始数据
  const handleTabChange = useCallback(
    (key: TabKey) => {
      setActiveTab(key);
      if (key === "ops" && !opsInited && stats) {
        const initial = stats.recentOps || [];
        setAllOps(initial);
        // 如果初始数据刚好是 200 条（旧 LIMIT），大概率还有更多
        setOpsHasMore(initial.length >= 200);
        setOpsTotal(initial.length);
        setOpsInited(true);
      }
    },
    [opsInited, stats],
  );

  // 加载更多
  const handleLoadMore = useCallback(async () => {
    if (!fetchOps || !stats) return;
    const offset = allOps.length;
    const result = await fetchOps(stats.taskId, PAGE_SIZE, offset);
    setAllOps((prev) => [...prev, ...result.ops]);
    setOpsTotal(result.total);
    setOpsHasMore(result.hasMore);
  }, [fetchOps, stats, allOps.length]);

  // dialog 关闭时重置分页状态
  const handleOpenChange = useCallback(
    (v: boolean) => {
      onOpenChange(v);
      if (!v) {
        setOpsInited(false);
        setAllOps([]);
        setOpsTotal(0);
        setOpsHasMore(false);
        setActiveTab("overview");
      }
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "max-w-lg p-0 flex flex-col gap-0 overflow-hidden",
          "h-[90dvh] sm:h-auto sm:max-h-[85vh]",
        )}
      >
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 shrink-0">
          <DialogTitle>任务详细统计</DialogTitle>
          <DialogDescription className="sr-only">
            查看任务的统计信息和操作记录
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="px-4 sm:px-6 flex gap-1 border-b shrink-0">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              className={cn(
                "px-3 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
              onClick={() => handleTabChange(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="px-4 sm:px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
            ) : stats ? (
              <>
                {activeTab === "overview" && (
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
                {activeTab === "ops" && (
                  <div className="pt-3">
                    <h3 className="text-sm font-semibold mb-3">
                      操作记录
                      <span className="text-muted-foreground font-normal ml-1 tabular-nums">
                        ({allOps.length}
                        {opsTotal > allOps.length && ` / ${opsTotal}`} 条)
                      </span>
                    </h3>
                    <RecentOps
                      ops={allOps}
                      total={opsTotal}
                      hasMore={opsHasMore}
                      onLoadMore={fetchOps ? handleLoadMore : undefined}
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
