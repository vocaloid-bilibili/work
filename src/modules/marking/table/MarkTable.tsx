// src/modules/marking/table/MarkTable.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TooltipProvider } from "@/ui/tooltip";
import { Button } from "@/ui/button";
import { RotateCcw } from "lucide-react";
import { COLUMNS, type ColDef } from "./columns";
import { useGridNav } from "./useGridNav";
import { useColWidths } from "./useColWidths";
import { useRowSelect } from "./useRowSelect";
import { useClipboard } from "./useClipboard";
import MarkTableRow from "./MarkTableRow";
import BulkBar from "./BulkBar";

interface P {
  data: any[];
  pageOffset: number;
  includes: boolean[];
  blacklists: boolean[];
  onInclude: (i: number, v: boolean) => void;
  onBlacklist: (i: number) => void;
  onUnblacklist: (i: number) => void;
  onFieldChange: (i: number, f: string, v: unknown) => void;
}

export default function MarkTable({
  data,
  pageOffset,
  includes,
  blacklists,
  onInclude,
  onBlacklist,
  onUnblacklist,
  onFieldChange,
}: P) {
  const nav = useGridNav(data.length, COLUMNS.length);
  const cols = useColWidths();
  const sel = useRowSelect(data.length);
  const tRef = useRef<HTMLDivElement>(null);
  const [initChar, setInitChar] = useState<string | undefined>();

  const { copy, paste } = useClipboard(
    data,
    pageOffset,
    nav.active,
    onFieldChange,
  );

  useEffect(() => {
    const up = () => sel.endDrag();
    document.addEventListener("mouseup", up);
    return () => document.removeEventListener("mouseup", up);
  }, [sel]);
  useEffect(() => {
    if (nav.active && !nav.editing) tRef.current?.focus();
  }, [nav.active, nav.editing]);
  useEffect(() => {
    if (!nav.editing) setInitChar(undefined);
  }, [nav.editing]);

  const commitField = useCallback(
    (row: number, col: ColDef, v: unknown) =>
      onFieldChange(pageOffset + row, col.key, v),
    [pageOffset, onFieldChange],
  );

  const totalPending = useMemo(() => {
    let c = 0;
    for (let i = 0; i < data.length; i++) {
      const ri = pageOffset + i;
      if (!includes[ri] && !blacklists[ri]) c++;
    }
    return c;
  }, [data.length, pageOffset, includes, blacklists]);

  const bulkInc = useCallback(() => {
    for (const r of sel.selected) {
      const ri = pageOffset + r;
      if (!blacklists[ri]) onInclude(ri, true);
    }
    sel.selectNone();
  }, [sel, pageOffset, blacklists, onInclude]);
  const bulkBl = useCallback(() => {
    for (const r of sel.selected) {
      const ri = pageOffset + r;
      if (!blacklists[ri] && !includes[ri]) onBlacklist(ri);
    }
    sel.selectNone();
  }, [sel, pageOffset, blacklists, includes, onBlacklist]);
  const selPend = useCallback(() => {
    sel.selectPending(
      includes.slice(pageOffset, pageOffset + data.length),
      blacklists.slice(pageOffset, pageOffset + data.length),
    );
  }, [sel, includes, blacklists, pageOffset, data.length]);

  const kd = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (nav.editing || !nav.active) return;
      const { row, col } = nav.active;
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
        nav.down(row, col);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        nav.up(row, col);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nav.next(row, col);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        nav.prev(row, col);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        e.shiftKey ? nav.prev(row, col) : nav.next(row, col);
        return;
      }
      if (e.key === "Enter" || e.key === "F2") {
        e.preventDefault();
        setInitChar(undefined);
        nav.startEdit();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const cd = COLUMNS[col];
        if (cd) onFieldChange(pageOffset + row, cd.key, "");
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        nav.clear();
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setInitChar(e.key);
        nav.startEdit();
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
  const aRow = nav.active?.row ?? -1;
  const aCol = nav.active?.col ?? null;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        ref={tRef}
        tabIndex={0}
        className="w-full border rounded-xl overflow-hidden bg-card flex flex-col outline-none"
        onKeyDown={kd}
      >
        <div className="overflow-auto max-h-[calc(100vh-220px)] flex-1">
          <table
            className="w-full text-sm border-collapse"
            style={{ tableLayout: "fixed" }}
          >
            <colgroup>
              {allCols.map((c) => (
                <col key={c.key} style={{ width: cols.getW(c.key) }} />
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
                      onDoubleClick={() => cols.resetCol(col.key)}
                    >
                      <div className="w-px h-3 bg-border group-hover/th:bg-primary/50 transition-colors" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((rec, i) => {
                const ri = pageOffset + i;
                return (
                  <MarkTableRow
                    key={ri}
                    record={rec}
                    row={i}
                    offset={pageOffset}
                    isIncluded={includes[ri]}
                    isBlacklisted={blacklists[ri] || false}
                    isSelected={sel.selected.has(i)}
                    isActiveRow={aRow === i}
                    activeCol={aRow === i ? aCol : null}
                    isEditing={aRow === i ? nav.editing : false}
                    initialChar={aRow === i ? initChar : undefined}
                    onInclude={onInclude}
                    onBlacklist={onBlacklist}
                    onUnblacklist={onUnblacklist}
                    commitField={commitField}
                    onCellSelect={nav.select}
                    onCellEdit={nav.startEdit}
                    stopEditing={nav.stopEdit}
                    clearActive={nav.clear}
                    next={nav.next}
                    prev={nav.prev}
                    down={nav.down}
                    getW={cols.getW}
                    onRowClick={sel.handleClick}
                    onDragStart={sel.startDrag}
                    onDragEnter={sel.onDragEnter}
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
        <BulkBar
          count={sel.selected.size}
          totalPending={totalPending}
          onIncludeAll={bulkInc}
          onBlacklistAll={bulkBl}
          onSelectPending={selPend}
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
              title="重置列宽"
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
