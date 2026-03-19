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

const MIN_W = 50;
const MAX_W = 600;

export function useColumnWidths() {
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    try {
      const s = localStorage.getItem("mark_col_widths");
      if (s) return { ...DEFAULTS, ...JSON.parse(s) };
    } catch {
      /* ignore */
    }
    return { ...DEFAULTS };
  });

  const indicatorRef = useRef<HTMLDivElement | null>(null);

  const save = (next: Record<string, number>) => {
    localStorage.setItem("mark_col_widths", JSON.stringify(next));
  };

  const startResize = useCallback(
    (key: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startW = widths[key] || DEFAULTS[key] || 150;

      const indicator = document.createElement("div");
      indicator.style.cssText = `
      position:fixed;top:0;bottom:0;width:2px;
      background:hsl(var(--primary));opacity:0.6;
      z-index:9999;pointer-events:none;
    `;
      indicator.style.left = `${e.clientX}px`;
      document.body.appendChild(indicator);
      indicatorRef.current = indicator;

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMove = (ev: MouseEvent) => {
        const w = Math.min(
          MAX_W,
          Math.max(MIN_W, startW + ev.clientX - startX),
        );
        indicator.style.left = `${ev.clientX}px`;
        setWidths((prev) => ({ ...prev, [key]: w }));
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        if (indicatorRef.current) {
          document.body.removeChild(indicatorRef.current);
          indicatorRef.current = null;
        }
        setWidths((prev) => {
          save(prev);
          return prev;
        });
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [widths],
  );

  // 双击重置单列
  const resetColumn = useCallback((key: string) => {
    setWidths((prev) => {
      const next = { ...prev, [key]: DEFAULTS[key] || 150 };
      save(next);
      return next;
    });
  }, []);

  // 全部重置
  const resetAll = useCallback(() => {
    setWidths({ ...DEFAULTS });
    localStorage.removeItem("mark_col_widths");
  }, []);

  const getWidth = useCallback(
    (key: string) => widths[key] || DEFAULTS[key] || 150,
    [widths],
  );

  return { getWidth, startResize, resetColumn, resetAll };
}
