import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import HintInput from "./HintInput";

interface Props {
  value: string;
  searchType?: string;
  onCommit: (v: string) => void;
  onCancel: () => void;
  onTab: (v: string) => void;
  onShiftTab: (v: string) => void;
  onMoveDown: (v: string) => void;
}

export default function TagCellEditor({
  value,
  searchType,
  onCancel,
  onTab,
  onShiftTab,
  onMoveDown,
}: Props) {
  const parsed = useMemo(
    () => (value ? value.split("、").filter(Boolean) : []),
    [value],
  );
  const [tags, setTags] = useState(parsed);
  const [input, setInput] = useState("");
  useEffect(() => {
    setTags(value ? value.split("、").filter(Boolean) : []);
    setInput("");
  }, [value]);

  const val = (extra?: string) => (extra ? [...tags, extra] : tags).join("、");
  const add = (t: string) => {
    const s = t.trim();
    if (s && !tags.includes(s)) setTags((p) => [...p, s]);
    setInput("");
  };
  const remove = (t: string) => setTags((p) => p.filter((x) => x !== t));

  const commitInput = () => {
    if (input.trim()) add(input.trim());
    else onMoveDown(val());
  };
  const tabVal = () => (input.trim() ? val(input.trim()) : val());

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
          onChange={setInput}
          onCommit={commitInput}
          onCancel={onCancel}
          onTab={() => onTab(tabVal())}
          onShiftTab={() => onShiftTab(tabVal())}
          onArrowDown={() => {
            if (!input) onMoveDown(val());
          }}
          searchType={searchType}
          autoFocus
          placeholder={tags.length === 0 ? "输入..." : ""}
        />
      </div>
    </div>
  );
}
