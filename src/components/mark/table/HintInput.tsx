import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import api from "@/utils/api";
import { useDebounce } from "@/hooks/use-debounce";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onCommit: (finalValue?: string) => void;
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
}: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [show, setShow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dv = useDebounce(value, 250);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!searchType || !dv || dv.length < 1) {
      setSuggestions([]);
      return;
    }
    api
      .search(searchType, dv)
      .then((r: any) => {
        const names =
          r.data && Array.isArray(r.data)
            ? r.data.map((i: any) => i.display_name || i.name).filter(Boolean)
            : [];
        setSuggestions(names);
      })
      .catch(() => setSuggestions([]));
  }, [dv, searchType]);

  useEffect(() => {
    setSelectedIdx(-1);
  }, [suggestions]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (selectedIdx >= 0 && suggestions[selectedIdx])
        onChange(suggestions[selectedIdx]);
      e.shiftKey ? onShiftTab() : onTab();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIdx >= 0 && suggestions[selectedIdx]) {
        onCommit(suggestions[selectedIdx]);
      } else {
        onCommit();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
      return;
    }
    if (e.key === "ArrowDown") {
      if (suggestions.length > 0) {
        e.preventDefault();
        setSelectedIdx((p) => (p < suggestions.length - 1 ? p + 1 : 0));
        setShow(true);
      } else onArrowDown?.();
      return;
    }
    if (e.key === "ArrowUp" && suggestions.length > 0 && show) {
      e.preventDefault();
      setSelectedIdx((p) => (p > 0 ? p - 1 : suggestions.length - 1));
    }
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShow(true);
        }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full h-full bg-transparent outline-none text-sm px-1",
          className,
        )}
        placeholder={placeholder}
        autoComplete="off"
      />
      {show && suggestions.length > 0 && (
        <div className="absolute left-0 top-full z-50 w-full mt-0.5 rounded-md border bg-popover shadow-lg max-h-40 overflow-y-auto">
          {suggestions.slice(0, 8).map((s, i) => (
            <button
              key={s + i}
              type="button"
              className={cn(
                "w-full text-left px-2 py-1.5 text-xs hover:bg-accent transition-colors",
                i === selectedIdx && "bg-accent",
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
