// src/components/contributions/DetailDialog.tsx

import { useState } from "react";
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
import type { TaskStats } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loading: boolean;
  stats: TaskStats | null;
}

type TabKey = "overview" | "ops";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "概览 & 贡献" },
  { key: "ops", label: "操作记录" },
];

export default function DetailDialog({
  open,
  onOpenChange,
  loading,
  stats,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 原生滚动 */}
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
                      最近操作
                      <span className="text-muted-foreground font-normal ml-1">
                        (最新 {stats.recentOps?.length || 0} 条)
                      </span>
                    </h3>
                    <RecentOps ops={stats.recentOps || []} />
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
