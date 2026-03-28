// src/modules/marking/table/useColWidths.ts
import { useState, useCallback, useRef } from "react";

const DEFAULTS: Record<string, number> = {
  _num: 44,
  _ops: 100,
  _title: 220,
  name: 200,
  vocal: 180,
  author: 180,
  synthesizer: 180,
  copyright: 110,
  type: 100,
};
const MIN_W = 50,
  MAX_W = 600;

export function useColWidths() {
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    try {
      const s = localStorage.getItem("mark_col_widths");
      if (s) return { ...DEFAULTS, ...JSON.parse(s) };
    } catch {
      /**/
    }
    return { ...DEFAULTS };
  });
  const indRef = useRef<HTMLDivElement | null>(null);

  const save = (n: Record<string, number>) =>
    localStorage.setItem("mark_col_widths", JSON.stringify(n));

  const startResize = useCallback(
    (key: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const sx = e.clientX,
        sw = widths[key] || DEFAULTS[key] || 150;
      const ind = document.createElement("div");
      ind.style.cssText = `position:fixed;top:0;bottom:0;width:2px;background:hsl(var(--primary));opacity:0.6;z-index:9999;pointer-events:none;`;
      ind.style.left = `${e.clientX}px`;
      document.body.appendChild(ind);
      indRef.current = ind;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      const move = (ev: MouseEvent) => {
        const w = Math.min(MAX_W, Math.max(MIN_W, sw + ev.clientX - sx));
        ind.style.left = `${ev.clientX}px`;
        setWidths((p) => ({ ...p, [key]: w }));
      };
      const up = () => {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        if (indRef.current) {
          document.body.removeChild(indRef.current);
          indRef.current = null;
        }
        setWidths((p) => {
          save(p);
          return p;
        });
      };
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    },
    [widths],
  );

  const resetCol = useCallback(
    (key: string) =>
      setWidths((p) => {
        const n = { ...p, [key]: DEFAULTS[key] || 150 };
        save(n);
        return n;
      }),
    [],
  );
  const resetAll = useCallback(() => {
    setWidths({ ...DEFAULTS });
    localStorage.removeItem("mark_col_widths");
  }, []);
  const getW = useCallback(
    (key: string) => widths[key] || DEFAULTS[key] || 150,
    [widths],
  );

  return { getW, startResize, resetCol, resetAll };
}
