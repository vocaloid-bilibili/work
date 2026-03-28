// src/modules/stats/Leaderboard.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/ui/dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/ui/cn";
import ContributorList from "./ContributorList";
import type { GlobalStats } from "@/core/types/stats";

interface P {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fetchGlobalStats: () => Promise<GlobalStats>;
}

export default function Leaderboard({
  open,
  onOpenChange,
  fetchGlobalStats,
}: P) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GlobalStats | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchGlobalStats()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, fetchGlobalStats]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-lg p-0 flex flex-col gap-0 overflow-hidden h-[90dvh] sm:h-auto sm:max-h-[85vh]",
        )}
      >
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 shrink-0">
          <DialogTitle>全局贡献排行</DialogTitle>
          <DialogDescription>
            {data
              ? `跨 ${data.taskCount} 个任务 · ${data.contributors.length} 位贡献者`
              : "加载中"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="px-4 sm:px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
            ) : data ? (
              <div className="pt-2">
                <ContributorList contributors={data.contributors} />
              </div>
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
