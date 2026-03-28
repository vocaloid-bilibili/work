// src/modules/marking/SearchBar.tsx
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/ui/cn";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import StatusDot from "@/shared/ui/StatusDot";

interface P {
  records: any[];
  includes: boolean[];
  blacklists: boolean[];
  onJump: (i: number) => void;
}
const MAX = 30;

export default function SearchBar({
  records,
  includes,
  blacklists,
  onJump,
}: P) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dq = useDebounce(q, 200);
  useClickOutside(wrap, () => setOpen(false));

  const hits = useMemo(() => {
    const s = dq.trim().toLowerCase();
    if (!s) return [];
    const out: {
      index: number;
      title: string;
      name?: string;
      included: boolean;
      blacklisted: boolean;
    }[] = [];
    for (let i = 0; i < records.length && out.length < MAX; i++) {
      const r = records[i];
      if (
        String(r.title ?? "")
          .toLowerCase()
          .includes(s) ||
        String(r.name ?? "")
          .toLowerCase()
          .includes(s) ||
        String(r.bvid ?? "")
          .toLowerCase()
          .includes(s)
      )
        out.push({
          index: i,
          title: String(r.title ?? r.name ?? `#${i + 1}`),
          name: r.name ? String(r.name) : undefined,
          included: includes[i] ?? false,
          blacklisted: blacklists[i] ?? false,
        });
    }
    return out;
  }, [dq, records, includes, blacklists]);

  useEffect(() => {
    setSel(0);
  }, [hits]);
  useEffect(() => {
    const el = listRef.current?.children[sel] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [sel]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  const pick = useCallback(
    (i: number) => {
      setOpen(false);
      setQ("");
      onJump(i);
    },
    [onJump],
  );
  const kd = (e: React.KeyboardEvent) => {
    if (!open || !hits.length) {
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setOpen(false);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((p) => (p < hits.length - 1 ? p + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((p) => (p > 0 ? p - 1 : hits.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(hits[sel].index);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative w-full max-w-sm" ref={wrap}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={kd}
          placeholder="搜索标题 / 歌名 / BV号…"
          className={cn(
            "w-full h-8 pl-8 pr-8 text-sm rounded-md border bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors",
          )}
        />
        {q && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setQ("");
              setOpen(false);
              inputRef.current?.focus();
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && dq.trim() && (
        <div className="absolute top-full left-0 z-50 w-full mt-1 rounded-md border bg-popover shadow-lg overflow-hidden">
          {hits.length > 0 ? (
            <>
              <div className="px-2.5 py-1.5 text-[11px] text-muted-foreground border-b bg-muted/30">
                找到 {hits.length}
                {hits.length >= MAX ? "+" : ""} 条{" "}
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
                      i === sel && "bg-accent",
                    )}
                    onMouseEnter={() => setSel(i)}
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
