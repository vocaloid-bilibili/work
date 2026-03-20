import { FileSpreadsheet, Pencil, CheckCircle2, Ban } from "lucide-react";
import StatCard from "./StatCard";
import RatioBar from "./RatioBar";
import type { TaskStats } from "./types";

export default function StatsOverview({ stats }: { stats: TaskStats }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="总记录"
          value={stats.recordCount}
          icon={<FileSpreadsheet className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="总操作"
          value={stats.totalOperations}
          icon={<Pencil className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="收录"
          value={stats.totalIncluded}
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
        />
        <StatCard
          label="排除"
          value={stats.totalBlacklisted}
          icon={<Ban className="h-3.5 w-3.5 text-red-500" />}
        />
      </div>
      <RatioBar
        recordCount={stats.recordCount}
        totalIncluded={stats.totalIncluded}
        totalBlacklisted={stats.totalBlacklisted}
      />
    </>
  );
}
