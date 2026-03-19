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
import type { TaskStats } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loading: boolean;
  stats: TaskStats | null;
}

export default function DetailDialog({
  open,
  onOpenChange,
  loading,
  stats,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>任务详细统计</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          ) : stats ? (
            <div className="space-y-5 pt-2">
              <StatsOverview stats={stats} />
              <Separator />
              <ContributorList stats={stats} />
              <FieldBreakdown breakdown={stats.fieldBreakdown} />
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
