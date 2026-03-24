// src/components/mark/MarkingTags.tsx

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { X } from "lucide-react";
import api from "@/utils/api";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import HighlightSpaces from "./HighlightSpaces";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onInputChange?: (v: string) => void;
  type: string;
  useHint: boolean;
  hasError?: boolean;
}

export default function MarkingTags({
  value,
  onChange,
  onInputChange,
  type,
  useHint,
  hasError,
}: Props) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debouncedInput = useDebounce(inputValue, 400);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const onInputChangeRef = useRef(onInputChange);
  useEffect(() => {
    onInputChangeRef.current = onInputChange;
  }, [onInputChange]);
  useEffect(() => {
    onInputChangeRef.current?.(debouncedInput);
  }, [debouncedInput]);

  const tags = value ? String(value).split("、").filter(Boolean) : [];

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (debouncedInput && useHint) {
      api
        .search(type, debouncedInput)
        .then((r) =>
          setSuggestions(r.data ? r.data.map((i: any) => i.name) : []),
        )
        .catch(() => setSuggestions([]));
    } else setSuggestions([]);
  }, [debouncedInput, type, useHint]);

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) onChange([...tags, tag].join("、"));
    setInputValue("");
    onInputChangeRef.current?.("");
    setOpen(false);
  };
  const removeTag = (t: string) =>
    onChange(tags.filter((x) => x !== t).join("、"));
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0)
      removeTag(tags[tags.length - 1]);
  };

  if (!useHint) {
    return (
      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10.5 items-center bg-muted/20">
        {tags.length > 0 ? (
          tags.map((t) => (
            <Badge key={t} variant="secondary" className="text-xs h-7 px-2.5">
              <HighlightSpaces text={t} />
            </Badge>
          ))
        ) : (
          <span className="text-muted-foreground text-xs px-1">无标签</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full relative" ref={wrapperRef}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 p-2 rounded-md border bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 min-h-10.5",
          hasError && "border-destructive focus-within:ring-destructive",
        )}
      >
        {tags.map((t) => (
          <Badge
            key={t}
            variant="secondary"
            className="pr-1.5 h-7 px-2.5 text-xs gap-1"
          >
            <HighlightSpaces text={t} />
            <button
              className="rounded-full outline-none focus:ring-2 focus:ring-ring"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(t);
              }}
            >
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
        <input
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-30 text-sm h-7"
          placeholder={tags.length === 0 ? "输入标签..." : ""}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>
      {open && (suggestions.length > 0 || inputValue) && (
        <div className="absolute top-full left-0 z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 overflow-hidden">
          <Command className="w-full">
            <CommandList className="max-h-50 overflow-y-auto p-1">
              {suggestions.length > 0 && (
                <CommandGroup heading="建议">
                  {suggestions.map((s) => (
                    <CommandItem
                      key={s}
                      value={s}
                      onSelect={() => addTag(s)}
                      className="cursor-pointer"
                    >
                      <HighlightSpaces text={s} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {inputValue && !suggestions.includes(inputValue) && (
                <CommandGroup heading="操作">
                  <CommandItem
                    value={inputValue}
                    onSelect={() => addTag(inputValue)}
                    className="cursor-pointer"
                  >
                    添加 "<HighlightSpaces text={inputValue} />"
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
