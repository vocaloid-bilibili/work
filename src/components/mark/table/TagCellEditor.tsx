import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import HintInput from "./HintInput";

interface Props {
  value: string;
  searchType?: string;
  initialChar?: string;
  onCommit: (v: string) => void;
  onCancel: () => void;
  onTab: (v: string) => void;
  onShiftTab: (v: string) => void;
  onMoveDown: (v: string) => void;
}

export default function TagCellEditor({
  value,
  searchType,
  initialChar,
  onCancel,
  onTab,
  onShiftTab,
  onMoveDown,
}: Props) {
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

  const joinTags = (extra?: string) =>
    (extra ? [...tags, extra] : tags).join("、");

  const addTag = (t: string) => {
    const s = t.trim();
    if (s && !tags.includes(s)) setTags((p) => [...p, s]);
    setInput("");
  };

  const removeTag = (t: string) => setTags((p) => p.filter((x) => x !== t));

  const handleInputChange = (v: string) => {
    if (v.endsWith("、")) {
      const tag = v.slice(0, -1).trim();
      if (tag) addTag(tag);
    } else {
      setInput(v);
    }
  };

  const handleCommit = (selected?: string) => {
    const pending = selected ?? (input.trim() || undefined);
    onMoveDown(joinTags(pending));
  };

  const tabVal = () => (input.trim() ? joinTags(input.trim()) : joinTags());

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
            onClick={() => removeTag(t)}
            className="ml-0.5 hover:text-destructive"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
      <div className="flex-1 min-w-15">
        <HintInput
          value={input}
          onChange={handleInputChange}
          onCommit={handleCommit}
          onCancel={onCancel}
          onTab={() => onTab(tabVal())}
          onShiftTab={() => onShiftTab(tabVal())}
          onArrowDown={() => {
            if (!input) onMoveDown(joinTags());
          }}
          searchType={searchType}
          autoFocus
          placeholder={tags.length === 0 ? "输入..." : ""}
        />
      </div>
    </div>
  );
}
