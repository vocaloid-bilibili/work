// src/components/mark/MarkRecordList.tsx

import MarkingCard from "@/components/mark/MarkingCard";
import MarkingTable from "@/components/mark/MarkingTable";
import type { LayoutMode, RecordType } from "./useMarkState";
import type { MarkFilter } from "./MarkOverviewBar";
import type { RecordAttribution } from "@/components/contributions/types";

interface Props {
  layoutMode: LayoutMode;
  pagedData: RecordType[];
  pagedRealIndices: number[];
  allData: RecordType[];
  includeEntries: boolean[];
  blacklistedEntries: boolean[];
  recordAttributions: RecordAttribution[];
  onIncludeChange: (index: number, value: boolean) => void;
  onBlacklist: (index: number) => void;
  onUnblacklist: (index: number) => void;
  onRecordUpdate: (index: number, updated: any) => void;
  onDirectFieldChange: (index: number, field: string, value: unknown) => void;
  filter: MarkFilter;
}

export default function MarkRecordList({
  layoutMode,
  pagedData,
  pagedRealIndices,
  allData,
  includeEntries,
  blacklistedEntries,
  recordAttributions,
  onIncludeChange,
  onBlacklist,
  onUnblacklist,
  onRecordUpdate,
  onDirectFieldChange,
  filter,
}: Props) {
  if (layoutMode === "table") {
    // 表格模式：暂不支持筛选过滤（全量渲染），或者你也可以传 filteredIndices
    return (
      <MarkingTable
        data={allData}
        pageOffset={0}
        includeEntries={includeEntries}
        blacklistedEntries={blacklistedEntries}
        onIncludeChange={onIncludeChange}
        onBlacklist={onBlacklist}
        onUnblacklist={onUnblacklist}
        onFieldChange={onDirectFieldChange}
      />
    );
  }

  if (pagedData.length === 0 && filter) {
    return (
      <div className="text-center text-muted-foreground py-16 text-sm">
        当前筛选条件下没有记录
      </div>
    );
  }

  return (
    <div
      className={`grid gap-4 ${layoutMode === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
    >
      {pagedData.map((record, i) => {
        const realIndex = pagedRealIndices[i];
        return (
          <MarkingCard
            key={realIndex}
            index={realIndex}
            record={record}
            include={includeEntries[realIndex]}
            blacklisted={blacklistedEntries[realIndex] || false}
            attribution={recordAttributions[realIndex]}
            onIncludeChange={(val) => onIncludeChange(realIndex, val)}
            onBlacklist={() => onBlacklist(realIndex)}
            onUnblacklist={() => onUnblacklist(realIndex)}
            onUpdate={(updated) => onRecordUpdate(realIndex, updated)}
          />
        );
      })}
    </div>
  );
}
