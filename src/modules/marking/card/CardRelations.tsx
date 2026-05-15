// src/modules/marking/card/CardRelations.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, X, Loader2, Link2, ExternalLink } from "lucide-react";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import * as api from "@/core/api/mainEndpoints";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import type { Song } from "@/core/types/catalog";

interface LinkedSong {
  id: number;
  name: string;
  display_name?: string | null;
  type?: string;
}

function parseOriginals(raw: unknown): LinkedSong[] {
  if (!raw) return [];
  try {
    const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

interface CardRelationsProps {
  value: unknown;
  onChange: (field: string, v: string) => void;
  blacklisted: boolean;
}

export default function CardRelations({
  value,
  onChange,
  blacklisted,
}: CardRelationsProps) {
  const links = parseOriginals(value);
  const existingIds = new Set(links.map((l) => l.id));

  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [busy, setBusy] = useState(false);
  const debouncedQuery = useDebounce(query, 400);
  const wrapRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapRef, () => {
    setAdding(false);
    setQuery("");
    setResults([]);
  });

  const shouldSearch = Boolean(debouncedQuery.trim().length >= 1 && adding);
  const searchKey = `${debouncedQuery}|${shouldSearch}`;
  const [prevSearchKey, setPrevSearchKey] = useState(searchKey);
  if (prevSearchKey !== searchKey) {
    setPrevSearchKey(searchKey);
    if (shouldSearch) {
      setBusy(true);
    } else {
      setResults([]);
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!shouldSearch) return;
    let cancelled = false;
    const trimmed = debouncedQuery.trim();
    const isId = /^\d+$/.test(trimmed);

    const doSearch = isId
      ? api
          .selectSong(Number(trimmed))
          .then((r) => [r.data])
          .catch(() => [] as Song[])
      : api
          .search("song", trimmed)
          .then((r: { data?: Song[] }) => (Array.isArray(r.data) ? r.data : []))
          .catch(() => [] as Song[]);

    doSearch
      .then((songs) => {
        if (!cancelled) setResults(songs);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, shouldSearch]);

  const filtered = results.filter((s) => !existingIds.has(s.id));

  const add = useCallback(
    (song: Song) => {
      const next: LinkedSong[] = [
        ...links,
        {
          id: song.id,
          name: song.name,
          display_name: song.display_name,
          type: song.type,
        },
      ];
      onChange("_original", JSON.stringify(next));
      setQuery("");
      setResults([]);
      setAdding(false);
    },
    [links, onChange],
  );

  const remove = useCallback(
    (id: number) => {
      const next = links.filter((l) => l.id !== id);
      onChange("_original", JSON.stringify(next.length ? next : []));
    },
    [links, onChange],
  );

  return (
    <div
      className={cn(
        "space-y-1.5",
        blacklisted && "opacity-50 pointer-events-none",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide flex items-center gap-1">
          <Link2 className="h-3 w-3" />
          关联原曲
        </span>
        {!blacklisted && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[10px] gap-0.5 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setAdding(!adding);
              if (adding) {
                setQuery("");
                setResults([]);
              }
            }}
          >
            {adding ? (
              <>
                <X className="h-2.5 w-2.5" /> 取消
              </>
            ) : (
              <>
                <Plus className="h-2.5 w-2.5" /> 添加
              </>
            )}
          </Button>
        )}
      </div>

      {links.length > 0 && (
        <div className="space-y-1">
          {links.map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1.5 group transition-colors hover:bg-muted/50"
            >
              <div className="flex-1 min-w-0">
                <span className="truncate block text-xs font-medium">
                  {l.display_name || l.name}
                </span>
                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                  #{l.id}
                  {l.type && (
                    <span className="bg-muted px-1 rounded">{l.type}</span>
                  )}
                </span>
              </div>
              <a
                href={`https://vocabili.top/song/${l.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-muted-foreground/40 hover:text-blue-500 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
              {!blacklisted && (
                <button
                  onClick={() => remove(l.id)}
                  className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="relative" ref={wrapRef}>
          <input
            className="w-full h-8 rounded-md border bg-background px-2.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            placeholder="搜索原曲名称或输入歌曲 ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {(busy || (filtered.length > 0 && query.trim())) && (
            <div className="absolute top-full left-0 z-50 w-full mt-1 rounded-md border bg-popover shadow-lg overflow-hidden">
              <div className="max-h-48 overflow-y-auto p-1">
                {busy && (
                  <div className="flex items-center justify-center gap-2 p-3 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> 搜索中…
                  </div>
                )}
                {!busy &&
                  filtered.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full text-left px-2.5 py-2 rounded-sm text-sm hover:bg-accent transition-colors flex flex-col gap-0.5"
                      onClick={() => add(s)}
                    >
                      <span className="font-medium truncate">
                        {s.display_name || s.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        <span className="bg-muted px-1 rounded">{s.type}</span>
                        {s.producers?.length ? (
                          <span>
                            P: {s.producers.map((p) => p.name).join(", ")}
                          </span>
                        ) : null}
                        <span>#{s.id}</span>
                      </span>
                    </button>
                  ))}
                {!busy && filtered.length === 0 && query.trim() && (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    未找到
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
