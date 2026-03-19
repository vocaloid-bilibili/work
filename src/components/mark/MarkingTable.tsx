import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { COLUMNS, type ColDef } from "./table/columns";
import { useTableNav } from "./table/useTableNav";
import { useColumnWidths } from "./table/useColumnWidths";
import { useRowSelection } from "./table/useRowSelection";
import { useClipboard } from "./table/useClipboard";
import TableRowComp from "./table/TableRow";
import BulkActionBar from "./table/BulkActionBar";

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
  const nav = useTableNav(data.length, COLUMNS.length);
  const cols = useColumnWidths();
  const sel = useRowSelection(data.length);
  const tableRef = useRef<HTMLDivElement>(null);
  const [initialChar, setInitialChar] = useState<string | undefined>(undefined);

  const { copy, paste } = useClipboard({
    data,
    pageOffset,
    activeCell: nav.activeCell,
    onFieldChange,
  });

  useEffect(() => {
    const up = () => sel.endDrag();
    document.addEventListener("mouseup", up);
    return () => document.removeEventListener("mouseup", up);
  }, [sel]);

  useEffect(() => {
    if (nav.activeCell && !nav.isEditing) {
      tableRef.current?.focus();
    }
  }, [nav.activeCell, nav.isEditing]);

  useEffect(() => {
    if (!nav.isEditing) setInitialChar(undefined);
  }, [nav.isEditing]);

  const commitField = useCallback(
    (row: number, col: ColDef, value: unknown) => {
      onFieldChange(pageOffset + row, col.key, value);
    },
    [pageOffset, onFieldChange],
  );

  const totalPending = useMemo(() => {
    let c = 0;
    for (let i = 0; i < data.length; i++) {
      const ri = pageOffset + i;
      if (!includeEntries[ri] && !blacklistedEntries[ri]) c++;
    }
    return c;
  }, [data.length, pageOffset, includeEntries, blacklistedEntries]);

  // 批量收录
  const handleBulkInclude = useCallback(() => {
    for (const row of sel.selected) {
      const ri = pageOffset + row;
      if (!blacklistedEntries[ri]) onIncludeChange(ri, true);
    }
    sel.selectNone();
  }, [sel, pageOffset, blacklistedEntries, onIncludeChange]);

  // 批量排除：跳过已收录的和已排除的
  const handleBulkBlacklist = useCallback(() => {
    for (const row of sel.selected) {
      const ri = pageOffset + row;
      if (!blacklistedEntries[ri] && !includeEntries[ri]) onBlacklist(ri);
    }
    sel.selectNone();
  }, [sel, pageOffset, blacklistedEntries, includeEntries, onBlacklist]);

  const handleSelectPending = useCallback(() => {
    sel.selectPending(
      includeEntries.slice(pageOffset, pageOffset + data.length),
      blacklistedEntries.slice(pageOffset, pageOffset + data.length),
    );
  }, [sel, includeEntries, blacklistedEntries, pageOffset, data.length]);

  const handleTableKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (nav.isEditing) return;
      if (!nav.activeCell) return;

      const { row, col } = nav.activeCell;

      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        void copy();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        void paste();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        sel.selectAll();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        nav.moveDown(row, col);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        nav.moveUp(row, col);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nav.moveNext(row, col);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        nav.movePrev(row, col);
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) nav.movePrev(row, col);
        else nav.moveNext(row, col);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        setInitialChar(undefined);
        nav.startEditing();
        return;
      }

      if (e.key === "F2") {
        e.preventDefault();
        setInitialChar(undefined);
        nav.startEditing();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const colDef = COLUMNS[col];
        if (colDef) {
          const ri = pageOffset + row;
          onFieldChange(ri, colDef.key, "");
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        nav.clearActive();
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setInitialChar(e.key);
        nav.startEditing();
        return;
      }
    },
    [nav, copy, paste, sel, pageOffset, onFieldChange],
  );

  const fixedCols = [
    { key: "_num", label: "#" },
    { key: "_ops", label: "操作" },
    { key: "_title", label: "标题" },
  ];
  const allCols = [
    ...fixedCols,
    ...COLUMNS.map((c) => ({ key: c.key, label: c.label })),
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div
        ref={tableRef}
        tabIndex={0}
        className="w-full border rounded-xl overflow-hidden bg-card flex flex-col outline-none"
        onKeyDown={handleTableKeyDown}
      >
        <div className="overflow-auto max-h-[calc(100vh-220px)] flex-1">
          <table
            className="w-full text-sm border-collapse"
            style={{ tableLayout: "fixed" }}
          >
            <colgroup>
              {allCols.map((c) => (
                <col key={c.key} style={{ width: cols.getWidth(c.key) }} />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-20">
              <tr className="bg-muted/90 backdrop-blur-sm border-b">
                {allCols.map((col) => (
                  <th
                    key={col.key}
                    className="text-[11px] font-semibold text-muted-foreground px-2 py-2.5 text-left border-r last:border-r-0 relative select-none group/th"
                  >
                    <span
                      className={
                        col.key === "_num" || col.key === "_ops"
                          ? "block text-center"
                          : ""
                      }
                    >
                      {col.label}
                    </span>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize group-hover/th:bg-primary/20 active:bg-primary/40 transition-colors flex items-center justify-center"
                      onMouseDown={(e) => cols.startResize(col.key, e)}
                      onDoubleClick={() => cols.resetColumn(col.key)}
                    >
                      <div className="w-px h-3 bg-border group-hover/th:bg-primary/50 transition-colors" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((record, i) => {
                const ri = pageOffset + i;
                return (
                  <TableRowComp
                    key={ri}
                    record={record}
                    rowInPage={i}
                    pageOffset={pageOffset}
                    isIncluded={includeEntries[ri]}
                    isBlacklisted={blacklistedEntries[ri] || false}
                    isSelected={sel.selected.has(i)}
                    activeCell={nav.activeCell}
                    isEditing={nav.isEditing}
                    initialChar={
                      nav.activeCell?.row === i ? initialChar : undefined
                    }
                    onIncludeChange={onIncludeChange}
                    onBlacklist={onBlacklist}
                    onUnblacklist={onUnblacklist}
                    commitField={commitField}
                    onCellSelect={nav.setActiveCell}
                    onCellEdit={nav.startEditing}
                    stopEditing={nav.stopEditing}
                    clearActive={nav.clearActive}
                    moveNext={nav.moveNext}
                    movePrev={nav.movePrev}
                    moveDown={nav.moveDown}
                    getWidth={cols.getWidth}
                    onRowClick={sel.handleClick}
                    onRowDragStart={sel.startDrag}
                    onRowDragEnter={sel.onDragEnter}
                  />
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan={allCols.length}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <BulkActionBar
          count={sel.selected.size}
          totalPending={totalPending}
          onIncludeAll={handleBulkInclude}
          onBlacklistAll={handleBulkBlacklist}
          onSelectPending={handleSelectPending}
          onClear={sel.selectNone}
        />

        {sel.selected.size === 0 && (
          <div className="border-t px-3 py-1.5 flex items-center justify-between text-[11px] text-muted-foreground bg-muted/30">
            <span>
              共 {data.length} 行
              {totalPending > 0 && (
                <span className="ml-2">· 待处理 {totalPending}</span>
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-[10px] gap-1 px-2"
              onClick={cols.resetAll}
              title="重置所有列宽"
            >
              <RotateCcw className="h-3 w-3" />
              重置列宽
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
