import ContributorCard from "./ContributorCard";
import type { TaskStats } from "./types";

const COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-lime-500",
];

export default function ContributorList({ stats }: { stats: TaskStats }) {
  const maxOps = stats.contributors.reduce(
    (m, c) => Math.max(m, c.totalOps),
    0,
  );
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">
          贡献者
          <span className="text-muted-foreground font-normal ml-1">
            ({stats.contributors.length}人 · {stats.totalOperations}次操作)
          </span>
        </h3>
      </div>
      {stats.contributors.length === 0 ? (
        <div className="text-center text-muted-foreground py-10 text-sm">
          暂无操作记录
        </div>
      ) : (
        <div className="space-y-3">
          {stats.contributors.map((c, i) => (
            <ContributorCard
              key={c.user.id}
              contributor={c}
              rank={i + 1}
              maxOps={maxOps}
              colorClass={COLORS[i % COLORS.length]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
