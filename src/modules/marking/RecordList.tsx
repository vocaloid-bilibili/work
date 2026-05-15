// src/modules/marking/RecordList.tsx
import type { LayoutMode } from "./state/useMarkCore";
import type { Filter } from "./state/useMarkPaging";
import type { Attribution } from "@/core/types/stats";
import type { Row } from "@/core/types/collab";
import EmptyState from "@/shared/ui/EmptyState";

import { lazy, Suspense } from "react";
const MarkCard = lazy(() => import("./card/MarkCard"));

interface P {
  layout: LayoutMode;
  pagedData: Row[];
  pagedIndices: number[];
  allData: Row[];
  includes: boolean[];
  blacklists: boolean[];
  attributions: Attribution[];
  onInclude: (i: number, v: boolean) => void;
  onBlacklist: (i: number) => void;
  onUnblacklist: (i: number) => void;
  onRecordUpdate: (i: number, u: Row | ((prev: Row) => Row)) => void;
  onFieldChange: (i: number, f: string, v: unknown) => void;
  filter: Filter;
  highlightIndex: number | null;
  filteredIndices: number[] | null;
}

export default function RecordList({
  layout,
  pagedData,
  pagedIndices,
  includes,
  blacklists,
  attributions,
  onInclude,
  onBlacklist,
  onUnblacklist,
  onRecordUpdate,
  filter,
  highlightIndex,
}: P) {
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
              highlight={highlightIndex === ri}
            />
          );
        })}
      </div>
    </Suspense>
  );
}
