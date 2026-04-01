// src/modules/editor/EditorSearch.tsx
import { useState, useRef, useEffect } from "react";
import { Input } from "@/ui/input";
import { Loader2, Search } from "lucide-react";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import * as api from "@/core/api/mainEndpoints";
import type { Song } from "@/core/types/catalog";
import { cn } from "@/ui/cn";

interface Props {
  onSelectSong: (song: { id: number; name: string }) => void;
  onSelectVideo: (bvid: string) => void;
  className?: string;
}

export default function EditorSearch({
  onSelectSong,
  onSelectVideo,
  className,
}: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hints, setHints] = useState<Song[]>([]);
  const dv = useDebounce(input, 400);
  const wrap = useRef<HTMLDivElement>(null);
  useClickOutside(wrap, () => setOpen(false));

  const isBvid = /^BV[a-zA-Z0-9]{10}$/i.test(input.trim());

  useEffect(() => {
    if (!dv || dv.length < 1 || isBvid) {
      setHints([]);
      return;
    }
    setBusy(true);
    api
      .search("song", dv)
      .then((r: any) => setHints(r.data && Array.isArray(r.data) ? r.data : []))
      .catch(() => setHints([]))
      .finally(() => setBusy(false));
  }, [dv]);

  const handleSubmit = () => {
    const v = input.trim();
    if (!v) return;
    if (/^BV/i.test(v)) {
      onSelectVideo(v);
      setInput("");
      setOpen(false);
    }
  };

  const pickSong = (s: Song) => {
    onSelectSong({ id: s.id, name: s.name });
    setInput("");
    setOpen(false);
    setHints([]);
  };

  return (
    <div className={cn("relative", className)} ref={wrap}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 pr-10 h-11 text-base"
          placeholder="搜索歌曲名、输入 BV 号后回车…"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (isBvid) handleSubmit();
              else if (hints.length === 1) pickSong(hints[0]);
            }
          }}
        />
        {busy && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* BV号提示 */}
      {isBvid && open && (
        <div className="absolute top-full left-0 z-50 w-full mt-1 rounded-md border bg-popover shadow-md p-2">
          <div
            className="cursor-pointer hover:bg-accent px-3 py-2 rounded-sm text-sm"
            onClick={handleSubmit}
          >
            加载视频{" "}
            <span className="font-mono text-muted-foreground">
              {input.trim()}
            </span>
          </div>
        </div>
      )}

      {/* 歌曲搜索结果 */}
      {!isBvid && open && (hints.length > 0 || (busy && dv)) && (
        <div className="absolute top-full left-0 z-50 w-full mt-1 rounded-md border bg-popover shadow-md overflow-hidden">
          <div className="max-h-80 overflow-y-auto p-1">
            {busy && hints.length === 0 && (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                搜索中…
              </div>
            )}
            {hints.map((song) => (
              <div
                key={song.id}
                onClick={() => pickSong(song)}
                className="cursor-pointer hover:bg-accent px-3 py-2.5 rounded-sm text-sm flex flex-col gap-0.5"
              >
                <div className="font-medium">
                  {song.display_name || song.name}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                    {song.type}
                  </span>
                  {song.producers && song.producers.length > 0 && (
                    <span>
                      P: {song.producers.map((p) => p.name).join(", ")}
                    </span>
                  )}
                  {song.vocalists && song.vocalists.length > 0 && (
                    <span>
                      V: {song.vocalists.map((v) => v.name).join(", ")}
                    </span>
                  )}
                  <span className="text-muted-foreground/50">
                    ID: {song.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
