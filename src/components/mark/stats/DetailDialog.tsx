import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import StatsOverview from "./StatsOverview";
import ContributorList from "./ContributorList";
import FieldBreakdown from "./FieldBreakdown";
import RecentOps from "./RecentOps";
import type { TaskStats } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loading: boolean;
  stats: TaskStats | null;
}

type TabKey = "overview" | "ops";

export default function DetailDialog({
  open,
  onOpenChange,
  loading,
  stats,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>任务详细统计</DialogTitle>
        </DialogHeader>

        {/* Tab 切换 */}
        <div className="px-6 flex gap-1 border-b">
          <button
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            概览 & 贡献
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "ops"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("ops")}
          >
            操作记录
          </button>
        </div>

        <ScrollArea className="flex-1 px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          ) : stats ? (
            <>
              {activeTab === "overview" && (
                <div className="space-y-5 pt-2">
                  <StatsOverview stats={stats} />
                  <Separator />
                  <ContributorList stats={stats} />
                  <FieldBreakdown breakdown={stats.fieldBreakdown} />
                </div>
              )}
              {activeTab === "ops" && (
                <div className="pt-4">
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
