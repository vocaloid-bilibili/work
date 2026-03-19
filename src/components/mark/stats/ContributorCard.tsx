import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Ban, Pencil } from "lucide-react";
import UserAvatar from "./UserAvatar";
import type { ContributorStats } from "./types";

interface Props {
  contributor: ContributorStats;
  rank: number;
  maxOps: number;
  colorClass: string;
}

export default function ContributorCard({
  contributor,
  rank,
  maxOps,
  colorClass,
}: Props) {
  const { user, totalOps, includes, blacklists, fieldEdits } = contributor;
  const name = user.nickname || user.username || user.id.slice(0, 8);
  const pct = maxOps > 0 ? (totalOps / maxOps) * 100 : 0;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 transition-colors hover:bg-muted/30">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-muted-foreground/50 w-6 text-center shrink-0">
          {rank}
        </span>
        <UserAvatar src={user.avatar} name={name} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{name}</div>
          {user.nickname && user.username && (
            <div className="text-[11px] text-muted-foreground truncate">
              @{user.username}
            </div>
          )}
        </div>
        <Badge variant="secondary" className="text-sm font-bold shrink-0">
          {totalOps}
        </Badge>
      </div>
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
        <div className="flex items-center gap-1.5 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span className="text-muted-foreground">收录</span>
          <span className="font-semibold ml-auto">{includes}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Ban className="h-3.5 w-3.5 text-red-500 shrink-0" />
          <span className="text-muted-foreground">排除</span>
          <span className="font-semibold ml-auto">{blacklists}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Pencil className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <span className="text-muted-foreground">编辑</span>
          <span className="font-semibold ml-auto">{fieldEdits}</span>
        </div>
      </div>
    </div>
  );
}
