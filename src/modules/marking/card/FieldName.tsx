// src/modules/marking/card/FieldName.tsx
import { useState, useEffect, useRef } from "react";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import * as api from "@/core/api/mainEndpoints";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import type { Song } from "@/core/types/catalog";
import { cn } from "@/ui/cn";

interface P {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  hasError?: boolean;
}

export default function FieldName({ value, onChange, className, hasError }: P) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value || "");
  const [hints, setHints] = useState<Song[]>([]);
  const [busy, setBusy] = useState(false);
  const dv = useDebounce(input, 500);
  const wrap = useRef<HTMLDivElement>(null);
  useClickOutside(wrap, () => setOpen(false));

  useEffect(() => {
    setInput(value || "");
  }, [value]);
  useEffect(() => {
    if (dv && dv.length >= 1 && open) {
      setBusy(true);
      api
        .search("song", dv)
        .then((r: any) =>
          setHints(r.data && Array.isArray(r.data) ? r.data : []),
        )
        .catch(() => setHints([]))
        .finally(() => setBusy(false));
    } else setHints([]);
  }, [dv, open]);

  const pick = (s: Song) => {
    const v = s.display_name || s.name;
    setInput(v);
    onChange(v);
    setOpen(false);
  };
  const exact = hints.find((s) => s.name === input || s.display_name === input);

  return (
    <div className={cn("flex gap-2 relative w-full", className)} ref={wrap}>
      <div className="relative w-full">
        <Input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onBlur={() => {
            if (input !== value) onChange(input);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onChange(input);
              setOpen(false);
            }
          }}
          onFocus={() => setOpen(true)}
          className={cn(
            "h-9 w-full",
            hasError && "border-destructive focus-visible:ring-destructive",
          )}
          placeholder="输入歌曲名称..."
        />
        {open && (hints.length > 0 || busy) && (
          <div className="absolute top-full left-0 z-50 w-full mt-1 rounded-md border bg-popover shadow-md overflow-hidden">
            <div className="max-h-75 overflow-y-auto p-1 bg-background">
              {busy && (
                <div className="flex items-center justify-center p-4 text-sm text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  搜索中...
                </div>
              )}
              {!busy && hints.length > 0 && (
                <div className="py-1">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    搜索结果
                  </div>
                  {hints.map((song) => (
                    <div
                      key={song.id}
                      onClick={() => pick(song)}
                      className="cursor-pointer hover:bg-accent px-2 py-2 rounded-sm text-sm flex flex-col gap-0.5"
                    >
                      <div className="font-medium">
                        {song.display_name || song.name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="bg-muted px-1 rounded">
                          {song.type}
                        </span>
                        {song.producers && song.producers.length > 0 && (
                          <span>
                            P主: {song.producers.map((p) => p.name).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!busy && hints.length === 0 && input && (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  未找到
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {exact && (
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 shrink-0"
          asChild
        >
          <a
            href={`https://vocabili.top/song/${exact.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      )}
    </div>
  );
}
