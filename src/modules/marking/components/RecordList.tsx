// src/modules/marking/components/RecordList.tsx
import { lazy, Suspense } from "react";
import type { LayoutMode } from "../hooks/useMarkCore";
import type { Filter } from "../hooks/useMarkPaging";
import type { Attribution } from "@/core/types/stats";
import type { Row } from "@/core/types/collab";
import EmptyState from "@/shared/ui/EmptyState";

const MarkCard = lazy(() => import("../card/MarkCard"));

interface RecordListProps {
  layout: LayoutMode;
  pagedData: Row[];
  pagedIndices: number[];
  includes: boolean[];
  blacklists: boolean[];
  attributions: Attribution[];
  onToggleInclude: (i: number, v: boolean) => void;
  onBlacklist: (i: number) => void;
  onUnblacklist: (i: number) => void;
  onUpdateRecord: (i: number, u: Row | ((prev: Row) => Row)) => void;
  filter: Filter;
  highlightIndex: number | null;
}

export default function RecordList({
  layout,
  pagedData,
  pagedIndices,
  includes,
  blacklists,
  attributions,
  onToggleInclude,
  onBlacklist,
  onUnblacklist,
  onUpdateRecord,
  filter,
  highlightIndex,
}: RecordListProps) {
  if (pagedData.length === 0 && filter) {
    return <EmptyState text="当前筛选条件下没有记录" />;
  }

  return (
    <Suspense fallback={null}>
      <div className={`grid gap-4 ${layout === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
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
              onToggleInclude={onToggleInclude}
              onBlacklist={onBlacklist}
              onUnblacklist={onUnblacklist}
              onUpdateRecord={onUpdateRecord}
              highlight={highlightIndex === ri}
            />
          );
        })}
      </div>
    </Suspense>
  );
}
