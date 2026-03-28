// src/shared/ui/HintInput.tsx
import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { cn } from "@/ui/cn";
import * as api from "@/core/api/mainEndpoints";
import { useDebounce } from "../hooks/useDebounce";

interface P {
  value: string;
  onChange: (v: string) => void;
  onCommit: (final?: string) => void;
  onCancel: () => void;
  onTab: () => void;
  onShiftTab: () => void;
  onArrowDown?: () => void;
  searchType?: string;
  autoFocus?: boolean;
  className?: string;
  placeholder?: string;
}

export default function HintInput({
  value,
  onChange,
  onCommit,
  onCancel,
  onTab,
  onShiftTab,
  onArrowDown,
  searchType,
  autoFocus,
  className,
  placeholder,
}: P) {
  const [hints, setHints] = useState<string[]>([]);
  const [idx, setIdx] = useState(-1);
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const dv = useDebounce(value, 250);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  useEffect(() => {
    if (!searchType || !dv) {
      setHints([]);
      return;
    }
    api
      .search(searchType, dv)
      .then((r: any) => {
        setHints(
          r.data?.map?.((i: any) => i.display_name || i.name).filter(Boolean) ||
            [],
        );
      })
      .catch(() => setHints([]));
  }, [dv, searchType]);
  useEffect(() => setIdx(-1), [hints]);

  const kd = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (idx >= 0 && hints[idx]) onChange(hints[idx]);
      e.shiftKey ? onShiftTab() : onTab();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      onCommit(idx >= 0 ? hints[idx] : undefined);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
      return;
    }
    if (e.key === "ArrowDown") {
      if (hints.length) {
        e.preventDefault();
        setIdx((p) => (p < hints.length - 1 ? p + 1 : 0));
        setShow(true);
      } else onArrowDown?.();
      return;
    }
    if (e.key === "ArrowUp" && hints.length && show) {
      e.preventDefault();
      setIdx((p) => (p > 0 ? p - 1 : hints.length - 1));
    }
  };

  return (
    <div className="relative w-full">
      <input
        ref={ref}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShow(true);
        }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        onKeyDown={kd}
        className={cn(
          "w-full h-full bg-transparent outline-none text-sm px-1",
          className,
        )}
        placeholder={placeholder}
        autoComplete="off"
      />
      {show && hints.length > 0 && (
        <div className="absolute left-0 top-full z-50 w-full mt-0.5 rounded-md border bg-popover shadow-lg max-h-40 overflow-y-auto">
          {hints.slice(0, 8).map((s, i) => (
            <button
              key={s + i}
              type="button"
              className={cn(
                "w-full text-left px-2 py-1.5 text-xs hover:bg-accent transition-colors",
                i === idx && "bg-accent",
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                onCommit(s);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
