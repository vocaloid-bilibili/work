// src/modules/marking/table/CellEditorSelect.tsx
import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { cn } from "@/ui/cn";

interface P {
  value: any;
  options: readonly {
    readonly value: number | string;
    readonly label: string;
  }[];
  onCommit: (v: any) => void;
  onCancel: () => void;
  onTab: (v: any) => void;
  onShiftTab: (v: any) => void;
}

export default function CellEditorSelect({
  value,
  options,
  onCommit,
  onCancel,
  onTab,
  onShiftTab,
}: P) {
  const [idx, setIdx] = useState(() => {
    const i = options.findIndex((o) => String(o.value) === String(value));
    return i >= 0 ? i : 0;
  });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  const kd = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((p) => Math.min(p + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((p) => Math.max(p - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      onCommit(options[idx].value);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const v = options[idx].value;
      e.shiftKey ? onShiftTab(v) : onTab(v);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      onKeyDown={kd}
      className="absolute left-0 top-full z-50 w-full mt-0.5 rounded-md border bg-popover shadow-lg outline-none"
    >
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          className={cn(
            "w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors",
            i === idx && "bg-accent font-medium",
          )}
          onMouseDown={(e) => {
            e.preventDefault();
            onCommit(o.value);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
