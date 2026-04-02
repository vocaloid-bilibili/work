// src/modules/marking/table/useClipboard.ts
import { useCallback } from "react";
import { COLUMNS, COPYRIGHT_MAP, type ColDef } from "./columns";
import { COPYRIGHT } from "@/core/types/constants";
import type { Cell } from "./useGridNav";
import { toast } from "sonner";

function fmt(rec: any, col: ColDef): string {
  const v = rec[col.key];
  if (v == null) return "";
  if (col.key === "copyright") return COPYRIGHT_MAP[Number(v)] || String(v);
  return String(v);
}

function parse(col: ColDef, text: string): unknown {
  if (col.type === "select" && col.key === "copyright") {
    const hit = COPYRIGHT.find((c) => c.label === text);
    if (hit) return hit.value;
    const n = Number(text);
    return isNaN(n) ? text : n;
  }
  return text;
}

export function useClipboard(
  data: any[],
  realIndices: number[],
  cell: Cell | null,
  onChange: (i: number, f: string, v: unknown) => void,
) {
  const copy = useCallback(async () => {
    if (!cell) return;
    const r = data[cell.row];
    const c = COLUMNS[cell.col];
    if (!r || !c) return;
    const t = fmt(r, c);
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = t;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    toast.success("已复制", { duration: 1200 });
  }, [data, cell]);

  const paste = useCallback(async () => {
    if (!cell) return;
    const c = COLUMNS[cell.col];
    if (!c) return;
    try {
      const t = await navigator.clipboard.readText();
      const parsed = parse(c, t.trim());
      onChange(realIndices[cell.row], c.key, parsed);
      toast.success("已粘贴", { duration: 1200 });
    } catch {
      toast.error("无法读取剪贴板");
    }
  }, [cell, realIndices, onChange]);

  return { copy, paste };
}
