import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Ban } from "lucide-react";

interface Props {
  total: number;
  included: number;
  blacklisted: number;
  pending: number;
  allIncluded: boolean;
  onChangeAll: (checked: boolean) => void;
}

export default function MarkOverviewBar({
  total,
  included,
  blacklisted,
  pending,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4 pb-3 border-b">
      <div className="flex flex-wrap gap-2 ml-auto text-xs">
        <Badge variant="secondary" className="gap-1">
          共 {total} 条
        </Badge>
        <Badge
          variant="outline"
          className="gap-1 border-emerald-300 text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle2 className="h-3 w-3" />
          收录 {included}
        </Badge>
        {blacklisted > 0 && (
          <Badge
            variant="outline"
            className="gap-1 border-red-300 text-red-600 dark:text-red-400"
          >
            <Ban className="h-3 w-3" />
            排除 {blacklisted}
          </Badge>
        )}
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          待处理 {pending}
        </Badge>
      </div>
    </div>
  );
}
