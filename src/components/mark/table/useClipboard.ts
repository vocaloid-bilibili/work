import { useCallback } from "react";
import { COLUMNS, type ColDef, COPYRIGHT_LABELS } from "./columns";
import type { CellAddress } from "./useTableNav";
import { toast } from "sonner";

interface UseClipboardOpts {
  data: any[];
  pageOffset: number;
  activeCell: CellAddress | null;
  onFieldChange: (realIndex: number, field: string, value: unknown) => void;
}

function formatCellValue(record: any, colDef: ColDef): string {
  const val = record[colDef.key];
  if (val === undefined || val === null) return "";
  if (colDef.key === "copyright")
    return COPYRIGHT_LABELS[Number(val)] || String(val);
  return String(val);
}

function parsePasteValue(colDef: ColDef, text: string): unknown {
  if (colDef.type === "select" && colDef.key === "copyright") {
    const reverseMap: Record<string, number> = {};
    for (const [k, v] of Object.entries(COPYRIGHT_LABELS))
      reverseMap[v] = Number(k);
    if (reverseMap[text] !== undefined) return reverseMap[text];
    const num = Number(text);
    return isNaN(num) ? text : num;
  }
  if (colDef.type === "select") return text;
  return text;
}

export function useClipboard({
  data,
  pageOffset,
  activeCell,
  onFieldChange,
}: UseClipboardOpts) {
  const copy = useCallback(async () => {
    if (!activeCell) return;
    const record = data[activeCell.row];
    if (!record) return;
    const colDef = COLUMNS[activeCell.col];
    if (!colDef) return;
    const text = formatCellValue(record, colDef);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已复制", { duration: 1200 });
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast.success("已复制", { duration: 1200 });
    }
  }, [data, activeCell]);

  const paste = useCallback(async () => {
    if (!activeCell) return;
    const colDef = COLUMNS[activeCell.col];
    if (!colDef) return;
    const realIndex = pageOffset + activeCell.row;
    try {
      const text = await navigator.clipboard.readText();
      const value = parsePasteValue(colDef, text.trim());
      onFieldChange(realIndex, colDef.key, value);
      toast.success("已粘贴", { duration: 1200 });
    } catch {
      toast.error("无法读取剪贴板，请检查浏览器权限");
    }
  }, [activeCell, pageOffset, onFieldChange]);

  return { copy, paste };
}
