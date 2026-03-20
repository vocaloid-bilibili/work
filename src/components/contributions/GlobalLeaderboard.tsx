// src/components/mark/stats/GlobalLeaderboard.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import ContributorList from "./ContributorList";
import type { GlobalStats } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fetchGlobalStats: () => Promise<GlobalStats>;
}

export default function GlobalLeaderboard({
  open,
  onOpenChange,
  fetchGlobalStats,
}: Props) {
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
      <DialogContent className="max-w-lg max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>全局贡献排行</DialogTitle>
          <DialogDescription>
            {data
              ? `跨 ${data.taskCount} 个任务 · ${data.contributors.length} 位贡献者`
              : "加载中"}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 pb-6">
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
