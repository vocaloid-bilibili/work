// src/modules/marking/table/CellEditorTags.tsx
import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/ui/badge";
import { X } from "lucide-react";
import HintInput from "@/shared/ui/HintInput";

interface P {
  value: string;
  searchType?: string;
  initialChar?: string;
  onCommit: (v: string) => void;
  onCancel: () => void;
  onTab: (v: string) => void;
  onShiftTab: (v: string) => void;
  onDown: (v: string) => void;
}

export default function CellEditorTags({
  value,
  searchType,
  initialChar,
  onCancel,
  onTab,
  onShiftTab,
  onDown,
}: P) {
  const parsed = useMemo(
    () => (value ? String(value).split("、").filter(Boolean) : []),
    [value],
  );
  const [tags, setTags] = useState(parsed);
  const [input, setInput] = useState(initialChar ?? "");
  useEffect(() => {
    setTags(value ? String(value).split("、").filter(Boolean) : []);
    if (initialChar === undefined) setInput("");
  }, [value, initialChar]);

  const join = (extra?: string) => (extra ? [...tags, extra] : tags).join("、");
  const add = (t: string) => {
    const s = t.trim();
    if (s && !tags.includes(s)) setTags((p) => [...p, s]);
    setInput("");
  };
  const remove = (t: string) => setTags((p) => p.filter((x) => x !== t));
  const handleInput = (v: string) => {
    if (v.endsWith("、")) {
      const t = v.slice(0, -1).trim();
      if (t) add(t);
    } else setInput(v);
  };
  const commit = (sel?: string) => {
    const pending = sel ?? (input.trim() || undefined);
    onDown(join(pending));
  };
  const tabVal = () => (input.trim() ? join(input.trim()) : join());

  return (
    <div className="flex flex-wrap items-center gap-1 w-full min-h-7 px-1">
      {tags.map((t) => (
        <Badge
          key={t}
          variant="secondary"
          className="text-[10px] h-5 px-1.5 gap-0.5 shrink-0"
        >
          {t}
          <button
            type="button"
            onClick={() => remove(t)}
            className="ml-0.5 hover:text-destructive"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
      <div className="flex-1 min-w-15">
        <HintInput
          value={input}
          onChange={handleInput}
          onCommit={commit}
          onCancel={onCancel}
          onTab={() => onTab(tabVal())}
          onShiftTab={() => onShiftTab(tabVal())}
          onArrowDown={() => {
            if (!input) onDown(join());
          }}
          searchType={searchType}
          autoFocus
          placeholder={tags.length === 0 ? "输入..." : ""}
        />
      </div>
    </div>
  );
}
