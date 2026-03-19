import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Ban, X, MousePointerClick } from "lucide-react";

interface Props {
  count: number;
  totalPending: number;
  onIncludeAll: () => void;
  onBlacklistAll: () => void;
  onSelectPending: () => void;
  onClear: () => void;
}

export default function BulkActionBar({
  count,
  totalPending,
  onIncludeAll,
  onBlacklistAll,
  onSelectPending,
  onClear,
}: Props) {
  if (count === 0) return null;

  return (
    <div className="sticky bottom-0 z-30 border-t bg-card/95 backdrop-blur-sm px-4 py-2.5 flex items-center gap-3 flex-wrap shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <Badge
        variant="secondary"
        className="text-sm font-bold gap-1.5 px-3 py-1"
      >
        已选 {count} 行
      </Badge>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="default"
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={onIncludeAll}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          全部收录
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="gap-1.5"
          onClick={onBlacklistAll}
        >
          <Ban className="h-3.5 w-3.5" />
          全部排除
        </Button>
      </div>

      <div className="h-5 w-px bg-border mx-1" />

      {totalPending > 0 && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={onSelectPending}
        >
          <MousePointerClick className="h-3.5 w-3.5" />
          选中全部待处理 ({totalPending})
        </Button>
      )}

      <Button
        size="sm"
        variant="ghost"
        className="ml-auto gap-1 text-xs text-muted-foreground"
        onClick={onClear}
      >
        <X className="h-3.5 w-3.5" />
        取消选择
      </Button>
    </div>
  );
}
