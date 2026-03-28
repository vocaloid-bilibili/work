// src/modules/marking/RecordList.tsx
import type { LayoutMode } from "./state/useMarkCore";
import type { Filter } from "./state/useMarkPaging";
import type { Attribution } from "@/core/types/stats";
import EmptyState from "@/shared/ui/EmptyState";

// 延迟加载 card 和 table（它们各自很重）
import { lazy, Suspense } from "react";
const MarkCard = lazy(() => import("./card/MarkCard"));
const MarkTable = lazy(() => import("./table/MarkTable"));

interface P {
  layout: LayoutMode;
  pagedData: any[];
  pagedIndices: number[];
  allData: any[];
  includes: boolean[];
  blacklists: boolean[];
  attributions: Attribution[];
  onInclude: (i: number, v: boolean) => void;
  onBlacklist: (i: number) => void;
  onUnblacklist: (i: number) => void;
  onRecordUpdate: (i: number, u: any) => void;
  onFieldChange: (i: number, f: string, v: unknown) => void;
  filter: Filter;
}

export default function RecordList({
  layout,
  pagedData,
  pagedIndices,
  allData,
  includes,
  blacklists,
  attributions,
  onInclude,
  onBlacklist,
  onUnblacklist,
  onRecordUpdate,
  onFieldChange,
  filter,
}: P) {
  if (layout === "table") {
    return (
      <Suspense
        fallback={
          <div className="text-center py-16 text-muted-foreground text-sm">
            加载表格...
          </div>
        }
      >
        <MarkTable
          data={allData}
          pageOffset={0}
          includes={includes}
          blacklists={blacklists}
          onInclude={onInclude}
          onBlacklist={onBlacklist}
          onUnblacklist={onUnblacklist}
          onFieldChange={onFieldChange}
        />
      </Suspense>
    );
  }

  if (pagedData.length === 0 && filter)
    return <EmptyState text="当前筛选条件下没有记录" />;

  return (
    <Suspense fallback={null}>
      <div
        className={`grid gap-4 ${layout === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
      >
        {pagedData.map((record, i) => {
          const ri = pagedIndices[i];
          return (
            <MarkCard
              key={ri}
              index={ri}
              record={record}
              include={includes[ri]}
              blacklisted={blacklists[ri] || false}
              attribution={attributions[ri]}
              onIncludeChange={(v) => onInclude(ri, v)}
              onBlacklist={() => onBlacklist(ri)}
              onUnblacklist={() => onUnblacklist(ri)}
              onUpdate={(u) => onRecordUpdate(ri, u)}
            />
          );
        })}
      </div>
    </Suspense>
  );
}
