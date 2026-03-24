// src/components/mark/MarkSearchBar.tsx

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Search, CheckCircle2, Ban, CircleDot, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchResult {
  index: number;
  title: string;
  name?: string;
  included: boolean;
  blacklisted: boolean;
}

interface Props {
  records: Array<Record<string, unknown>>;
  includeEntries: boolean[];
  blacklistedEntries: boolean[];
  onJump: (index: number) => void;
}

const MAX_RESULTS = 30;

export default function MarkSearchBar({
  records,
  includeEntries,
  blacklistedEntries,
  onJump,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 200);

  // 搜索结果
  const results = useMemo<SearchResult[]>(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];

    const matched: SearchResult[] = [];
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const title = String(r.title ?? "").toLowerCase();
      const name = String(r.name ?? "").toLowerCase();
      const bvid = String(r.bvid ?? "").toLowerCase();

      if (title.includes(q) || name.includes(q) || bvid.includes(q)) {
        matched.push({
          index: i,
          title: String(r.title ?? r.name ?? `#${i + 1}`),
          name: r.name ? String(r.name) : undefined,
          included: includeEntries[i] ?? false,
          blacklisted: blacklistedEntries[i] ?? false,
        });
        if (matched.length >= MAX_RESULTS) break;
      }
    }
    return matched;
  }, [debouncedQuery, records, includeEntries, blacklistedEntries]);

  // 重置选中
  useEffect(() => {
    setSelectedIdx(0);
  }, [results]);

  // 滚动选中项到可见区域
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[selectedIdx] as HTMLElement;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 全局快捷键 Ctrl+K / Cmd+K
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

  const handleSelect = useCallback(
    (index: number) => {
      setOpen(false);
      setQuery("");
      onJump(index);
    },
    [onJump],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) {
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setOpen(false);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((p) => (p < results.length - 1 ? p + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((p) => (p > 0 ? p - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(results[selectedIdx].index);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const showDropdown = open && debouncedQuery.trim().length > 0;

  return (
    <div className="relative w-full max-w-sm" ref={wrapperRef}>
      {/* 搜索框 */}
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
          className={cn(
            "w-full h-8 pl-8 pr-8 text-sm rounded-md border bg-background",
            "placeholder:text-muted-foreground/60",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            "transition-colors",
          )}
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
        {/* Cmd+K 提示 */}
        {!query && (
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/50 font-mono border rounded px-1 py-0.5 bg-muted/50">
            ⌘K
          </kbd>
        )}
      </div>

      {/* 下拉结果 */}
      {showDropdown && (
        <div className="absolute top-full left-0 z-50 w-full mt-1 rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 overflow-hidden">
          {results.length > 0 ? (
            <>
              <div className="px-2.5 py-1.5 text-[11px] text-muted-foreground border-b bg-muted/30">
                找到 {results.length}
                {results.length >= MAX_RESULTS ? "+" : ""} 条
                <span className="float-right">↑↓ 选择 · Enter 跳转</span>
              </div>
              <div
                ref={listRef}
                className="max-h-64 overflow-y-auto overscroll-contain"
              >
                {results.map((r, i) => (
                  <button
                    key={r.index}
                    type="button"
                    className={cn(
                      "w-full text-left px-2.5 py-2 flex items-start gap-2",
                      "hover:bg-accent transition-colors",
                      i === selectedIdx && "bg-accent",
                    )}
                    onMouseEnter={() => setSelectedIdx(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(r.index);
                    }}
                  >
                    {/* 序号 */}
                    <span className="text-[11px] text-muted-foreground/60 font-mono w-7 shrink-0 text-right tabular-nums pt-0.5">
                      {r.index + 1}
                    </span>

                    {/* 标题 + 歌名 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug truncate">{r.title}</p>
                      {r.name && r.name !== r.title && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          歌名: {r.name}
                        </p>
                      )}
                    </div>

                    {/* 状态 */}
                    <div className="shrink-0 pt-0.5">
                      {r.blacklisted ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4.5 px-1.5 border-red-300 text-red-500 gap-0.5"
                        >
                          <Ban className="h-2.5 w-2.5" />
                          排除
                        </Badge>
                      ) : r.included ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4.5 px-1.5 border-emerald-300 text-emerald-600 gap-0.5"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          收录
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4.5 px-1.5 border-amber-300/60 text-muted-foreground gap-0.5"
                        >
                          <CircleDot className="h-2.5 w-2.5" />
                          待处理
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              没有找到匹配的记录
            </div>
          )}
        </div>
      )}
    </div>
  );
}
