export default function RatioBar({
  recordCount,
  totalIncluded,
  totalBlacklisted,
}: {
  recordCount: number;
  totalIncluded: number;
  totalExcluded: number;
  totalBlacklisted: number;
}) {
  if (recordCount === 0) return null;
  const inclPct = (totalIncluded / recordCount) * 100;
  const blPct = (totalBlacklisted / recordCount) * 100;
  const restPct = 100 - inclPct - blPct;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>收录率 {inclPct.toFixed(1)}%</span>
        {totalBlacklisted > 0 && <span>排除 {totalBlacklisted}</span>}
      </div>
      <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${inclPct}%` }}
        />
        {totalBlacklisted > 0 && (
          <div
            className="h-full bg-red-400 transition-all duration-500"
            style={{ width: `${blPct}%` }}
          />
        )}
        <div
          className="h-full bg-muted-foreground/15 transition-all duration-500"
          style={{ width: `${restPct}%` }}
        />
      </div>
      <div className="flex gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          收录
        </span>
        {totalBlacklisted > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
            排除
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/15" />
          未收录
        </span>
      </div>
    </div>
  );
}
