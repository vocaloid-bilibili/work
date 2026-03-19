import MarkingCard from "@/components/mark/MarkingCard";
import MarkingTable from "@/components/mark/MarkingTable";
import type { LayoutMode, RecordType } from "./useMarkState";

interface Props {
  layoutMode: LayoutMode;
  pagedData: RecordType[];
  allData: RecordType[];
  pageOffset: number;
  includeEntries: boolean[];
  blacklistedEntries: boolean[];
  onIncludeChange: (index: number, value: boolean) => void;
  onBlacklist: (index: number) => void;
  onUnblacklist: (index: number) => void;
  onRecordUpdate: (index: number, updated: any) => void;
  onDirectFieldChange: (index: number, field: string, value: unknown) => void;
}

export default function MarkRecordList({
  layoutMode,
  pagedData,
  allData,
  pageOffset,
  includeEntries,
  blacklistedEntries,
  onIncludeChange,
  onBlacklist,
  onUnblacklist,
  onRecordUpdate,
  onDirectFieldChange,
}: Props) {
  if (layoutMode === "table") {
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

  return (
    <div
      className={`grid gap-4 ${layoutMode === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
    >
      {pagedData.map((record, i) => {
        const realIndex = pageOffset + i;
        return (
          <MarkingCard
            key={realIndex}
            index={realIndex}
            record={record}
            include={includeEntries[realIndex]}
            blacklisted={blacklistedEntries[realIndex] || false}
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
