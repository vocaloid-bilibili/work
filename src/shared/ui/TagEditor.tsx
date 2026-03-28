// src/shared/ui/TagEditor.tsx
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/ui/badge";
import { Command, CommandGroup, CommandItem, CommandList } from "@/ui/command";
import { X } from "lucide-react";
import * as api from "@/core/api/mainEndpoints";
import { cn } from "@/ui/cn";
import { useDebounce } from "../hooks/useDebounce";
import SpaceWarning from "./SpaceWarning";
import { useClickOutside } from "../hooks/useClickOutside";

interface P {
  value: string;
  onChange: (v: string) => void;
  onInputChange?: (v: string) => void;
  searchType: string;
  hasError?: boolean;
}

export default function TagEditor({
  value,
  onChange,
  onInputChange,
  searchType,
  hasError,
}: P) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [hints, setHints] = useState<string[]>([]);
  const dv = useDebounce(input, 400);
  const wrap = useRef<HTMLDivElement>(null);
  const onInputRef = useRef(onInputChange);
  useEffect(() => {
    onInputRef.current = onInputChange;
  }, [onInputChange]);
  useEffect(() => {
    onInputRef.current?.(dv);
  }, [dv]);
  useClickOutside(wrap, () => setOpen(false));

  const tags = value ? String(value).split("、").filter(Boolean) : [];

  useEffect(() => {
    if (!dv) {
      setHints([]);
      return;
    }
    api
      .search(searchType, dv)
      .then((r) => setHints(r.data?.map?.((i: any) => i.name) || []))
      .catch(() => setHints([]));
  }, [dv, searchType]);

  const add = (t: string) => {
    if (t && !tags.includes(t)) onChange([...tags, t].join("、"));
    setInput("");
    onInputRef.current?.("");
    setOpen(false);
  };
  const remove = (t: string) =>
    onChange(tags.filter((x) => x !== t).join("、"));
  const kd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && tags.length)
      remove(tags.at(-1)!);
  };

  return (
    <div className="flex flex-col gap-2 w-full relative" ref={wrap}>
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
            <SpaceWarning text={t} />
            <button
              className="rounded-full outline-none focus:ring-2 focus:ring-ring"
              onClick={(e) => {
                e.stopPropagation();
                remove(t);
              }}
            >
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
        <input
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-30 text-sm h-7"
          placeholder={tags.length === 0 ? "输入标签..." : ""}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={kd}
        />
      </div>
      {open && (hints.length > 0 || input) && (
        <div className="absolute top-full left-0 z-50 w-full mt-1 rounded-md border bg-popover shadow-md overflow-hidden">
          <Command className="w-full">
            <CommandList className="max-h-50 overflow-y-auto p-1">
              {input && !hints.includes(input) && (
                <CommandGroup heading="操作">
                  <CommandItem
                    value={input}
                    onSelect={() => add(input)}
                    className="cursor-pointer"
                  >
                    添加 "<SpaceWarning text={input} />"
                  </CommandItem>
                </CommandGroup>
              )}
              {hints.length > 0 && (
                <CommandGroup heading="建议">
                  {hints.map((s) => (
                    <CommandItem
                      key={s}
                      value={s}
                      onSelect={() => add(s)}
                      className="cursor-pointer"
                    >
                      <SpaceWarning text={s} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
