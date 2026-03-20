// src/components/contributions/ContributorList.tsx
import ContributorCard from "./ContributorCard";
import type { ContributorStats } from "./types";

export default function ContributorList({
  contributors,
  totalOps,
}: {
  contributors: ContributorStats[];
  totalOps?: number;
}) {
  const sorted = [...contributors].sort((a, b) => b.score - a.score);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">
          贡献者
          <span className="text-muted-foreground font-normal ml-1">
            ({sorted.length}人{totalOps !== undefined && ` · ${totalOps}次操作`}
            )
          </span>
        </h3>
      </div>
      {sorted.length === 0 ? (
        <div className="text-center text-muted-foreground py-10 text-sm">
          暂无操作记录
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((c, i) => (
            <ContributorCard key={c.user.id} contributor={c} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
