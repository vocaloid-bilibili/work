// src/components/contributions/ContributorCard.tsx
import { CheckCircle2, Ban, Pencil } from "lucide-react";
import UserAvatar from "./UserAvatar";
import type { ContributorStats } from "./types";

interface Props {
  contributor: ContributorStats;
  rank: number;
}

export default function ContributorCard({ contributor, rank }: Props) {
  const { user, score, includes, blacklists, fieldEdits, taskCount } =
    contributor;
  const name = user.nickname || user.username || user.id.slice(0, 8);
  const total = includes + blacklists + fieldEdits;
  const inclPct = total > 0 ? (includes / total) * 100 : 0;
  const blPct = total > 0 ? (blacklists / total) * 100 : 0;
  const editPct = total > 0 ? (fieldEdits / total) * 100 : 0;

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
        <div className="text-right shrink-0">
          <div className="text-lg font-bold">{score}</div>
          <div className="text-[10px] text-muted-foreground">积分</div>
        </div>
      </div>

      {total > 0 && (
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
          {includes > 0 && (
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${inclPct}%` }}
            />
          )}
          {blacklists > 0 && (
            <div
              className="h-full bg-red-400 transition-all duration-500"
              style={{ width: `${blPct}%` }}
            />
          )}
          {fieldEdits > 0 && (
            <div
              className="h-full bg-blue-400 transition-all duration-500"
              style={{ width: `${editPct}%` }}
            />
          )}
        </div>
      )}

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
      {taskCount !== undefined && taskCount > 1 && (
        <div className="text-[11px] text-muted-foreground">
          参与 {taskCount} 个任务
        </div>
      )}
    </div>
  );
}
