import { useCallback } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { COLUMNS, type ColDef } from "./table/columns";
import { useTableNav } from "./table/useTableNav";
import TableRowComp from "./table/TableRow";

interface Props {
  data: any[];
  pageOffset: number;
  includeEntries: boolean[];
  blacklistedEntries: boolean[];
  onIncludeChange: (i: number, v: boolean) => void;
  onBlacklist: (i: number) => void;
  onUnblacklist: (i: number) => void;
  onFieldChange: (i: number, field: string, value: unknown) => void;
}

export default function MarkingTable({
  data,
  pageOffset,
  includeEntries,
  blacklistedEntries,
  onIncludeChange,
  onBlacklist,
  onUnblacklist,
  onFieldChange,
}: Props) {
  const { activeCell, setActiveCell, moveNext, movePrev, moveDown } =
    useTableNav(data.length, COLUMNS.length);

  const commitField = useCallback(
    (rowInPage: number, colDef: ColDef, value: unknown) => {
      onFieldChange(pageOffset + rowInPage, colDef.key, value);
    },
    [pageOffset, onFieldChange],
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full border rounded-xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="bg-muted/70 backdrop-blur-sm border-b">
                <th className="text-[11px] font-semibold text-muted-foreground px-2 py-2.5 text-center w-11 border-r">
                  #
                </th>
                <th className="text-[11px] font-semibold text-muted-foreground px-1 py-2.5 text-center w-25 border-r">
                  操作
                </th>
                <th className="text-[11px] font-semibold text-muted-foreground px-2 py-2.5 text-left w-50 border-r">
                  标题
                </th>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      "text-[11px] font-semibold text-muted-foreground px-2 py-2.5 text-left border-r last:border-r-0",
                      c.width,
                    )}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((record, rowInPage) => {
                const ri = pageOffset + rowInPage;
                return (
                  <TableRowComp
                    key={ri}
                    record={record}
                    rowInPage={rowInPage}
                    pageOffset={pageOffset}
                    isIncluded={includeEntries[ri]}
                    isBlacklisted={blacklistedEntries[ri] || false}
                    activeCell={activeCell}
                    onIncludeChange={onIncludeChange}
                    onBlacklist={onBlacklist}
                    onUnblacklist={onUnblacklist}
                    commitField={commitField}
                    setActiveCell={setActiveCell}
                    moveNext={moveNext}
                    movePrev={movePrev}
                    moveDown={moveDown}
                  />
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan={3 + COLUMNS.length}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  );
}
