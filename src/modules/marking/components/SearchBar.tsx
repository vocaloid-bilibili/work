// src/modules/marking/components/SearchBar.tsx
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/ui/cn";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import StatusDot from "@/shared/ui/StatusDot";
import type { Row } from "@/core/types/collab";

interface SearchBarProps {
  records: Row[];
  includes: boolean[];
  blacklists: boolean[];
  onJump: (i: number) => void;
}

const MAX_RESULTS = 30;

export default function SearchBar({
  records,
  includes,
  blacklists,
  onJump,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 200);

  useClickOutside(wrapRef, () => setOpen(false));

  const hits = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    const out: {
      index: number;
      title: string;
      name?: string;
      included: boolean;
      blacklisted: boolean;
    }[] = [];
    for (let i = 0; i < records.length && out.length < MAX_RESULTS; i++) {
      const r = records[i];
      if (
        String(r.title ?? "")
          .toLowerCase()
          .includes(q) ||
        String(r.name ?? "")
          .toLowerCase()
          .includes(q) ||
        String(r.bvid ?? "")
          .toLowerCase()
          .includes(q)
      ) {
        out.push({
          index: i,
          title: String(r.title ?? r.name ?? `#${i + 1}`),
          name: r.name ? String(r.name) : undefined,
          included: includes[i] ?? false,
          blacklisted: blacklists[i] ?? false,
        });
      }
    }
    return out;
  }, [debouncedQuery, records, includes, blacklists]);

  const [prevHits, setPrevHits] = useState(hits);
  if (prevHits !== hits) {
    setPrevHits(hits);
    setSelected(0);
  }

  useEffect(() => {
    const el = listRef.current?.children[selected] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const pick = useCallback(
    (i: number) => {
      setOpen(false);
      setQuery("");
      onJump(i);
    },
    [onJump],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || !hits.length) {
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setOpen(false);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelected((p) => (p < hits.length - 1 ? p + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelected((p) => (p > 0 ? p - 1 : hits.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        pick(hits[selected].index);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div className="relative w-full max-w-sm" ref={wrapRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="搜索标题 / 歌名 / BV号…"
          className="w-full h-8 pl-8 pr-8 text-sm rounded-md border bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
        />
        {query && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setQuery("");
              setOpen(false);
              inputRef.current?.focus();
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && debouncedQuery.trim() && (
        <div className="absolute top-full left-0 z-50 w-full mt-1 rounded-md border bg-popover shadow-lg overflow-hidden">
          {hits.length > 0 ? (
            <>
              <div className="px-2.5 py-1.5 text-[11px] text-muted-foreground border-b bg-muted/30">
                找到 {hits.length}
                {hits.length >= MAX_RESULTS ? "+" : ""} 条
                <span className="float-right">↑↓ · Enter</span>
              </div>
              <div
                ref={listRef}
                className="max-h-64 overflow-y-auto overscroll-contain"
              >
                {hits.map((r, i) => (
                  <button
                    key={r.index}
                    type="button"
                    className={cn(
                      "w-full text-left px-2.5 py-2 flex items-start gap-2 hover:bg-accent transition-colors",
                      i === selected && "bg-accent",
                    )}
                    onMouseEnter={() => setSelected(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(r.index);
                    }}
                  >
                    <span className="text-[11px] text-muted-foreground/60 font-mono w-7 shrink-0 text-right tabular-nums pt-0.5">
                      {r.index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug truncate">{r.title}</p>
                      {r.name && r.name !== r.title && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          歌名: {r.name}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 pt-0.5">
                      <StatusDot
                        status={
                          r.blacklisted
                            ? "blacklisted"
                            : r.included
                              ? "included"
                              : "pending"
                        }
                      />
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              未找到
            </div>
          )}
        </div>
      )}
    </div>
  );
}
