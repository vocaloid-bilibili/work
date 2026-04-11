// src/modules/editor/layout/Kbar.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Loader2,
  Music,
  Video,
  GitMerge,
  Users,
  Tv,
  Plus,
  RefreshCcw,
} from "lucide-react";
import { useDebounce } from "@/shared/hooks/useDebounce";
import * as api from "@/core/api/mainEndpoints";
import { useEditor } from "../ctx";
import type { Song } from "@/core/types/catalog";
import { cn } from "@/ui/cn";

const COMMANDS = [
  { id: "add", icon: Plus, label: "添加收录" },
  { id: "merge-song", icon: GitMerge, label: "合并歌曲" },
  { id: "merge-artist", icon: Users, label: "合并艺人" },
  { id: "board", icon: Tv, label: "榜单视频" },
  { id: "sync", icon: RefreshCcw, label: "同步状态" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Kbar({ open, onClose }: Props) {
  const { openSong, openVideo, push } = useEditor();
  const [input, setInput] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [busy, setBusy] = useState(false);
  const [idx, setIdx] = useState(0);
  const dv = useDebounce(input, 300);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setInput("");
      setSongs([]);
      setIdx(0);
      setTimeout(() => ref.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!dv || dv.trim().length < 1) {
      setSongs([]);
      return;
    }
    if (/^BV/i.test(dv.trim()) || /^\d+$/.test(dv.trim())) {
      setSongs([]);
      return;
    }
    setBusy(true);
    api
      .search("song", dv)
      .then((r: any) => setSongs(Array.isArray(r.data) ? r.data : []))
      .catch(() => setSongs([]))
      .finally(() => setBusy(false));
  }, [dv]);

  const trimmed = input.trim();
  const isBv = /^BV[a-zA-Z0-9]{10}$/i.test(trimmed);
  const isId = /^\d+$/.test(trimmed) && trimmed.length > 0;
  const filteredCmds = COMMANDS.filter(
    (c) => !trimmed || c.label.includes(trimmed),
  );

  type Item =
    | { type: "cmd"; id: string }
    | { type: "bv" }
    | { type: "id" }
    | { type: "song"; song: Song };
  const items: Item[] = [];
  if (isBv) items.push({ type: "bv" });
  if (isId) items.push({ type: "id" });
  if (!isBv && !isId) {
    for (const s of songs.slice(0, 8)) items.push({ type: "song", song: s });
    if (!trimmed || songs.length === 0) {
      for (const c of filteredCmds) items.push({ type: "cmd", id: c.id });
    }
  }

  const safeIdx = items.length > 0 ? Math.min(idx, items.length - 1) : 0;

  const exec = useCallback(
    (item: Item) => {
      onClose();
      if (item.type === "bv") {
        openVideo(trimmed);
        return;
      }
      if (item.type === "id") {
        openSong(Number(trimmed));
        return;
      }
      if (item.type === "song") {
        openSong(item.song.id);
        return;
      }
      if (item.type === "cmd") {
        const map: Record<string, () => void> = {
          add: () => push({ id: "add" }),
          "merge-song": () => push({ id: "merge-song" }),
          "merge-artist": () => push({ id: "merge-artist" }),
          board: () => push({ id: "board" }),
          sync: () => push({ id: "sync" }),
        };
        map[item.id]?.();
      }
    },
    [trimmed, onClose, openSong, openVideo, push],
  );

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, items.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && items[safeIdx]) {
      e.preventDefault();
      exec(items[safeIdx]);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center pt-[12vh] sm:pt-[15vh] px-4"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 border-b">
          <Search className="h-4 w-4 text-muted-foreground/50 shrink-0" />
          <input
            ref={ref}
            className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
            placeholder="搜索歌曲、BV 号、ID…"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setIdx(0);
            }}
            onKeyDown={handleKey}
          />
          {busy && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40 shrink-0" />
          )}
        </div>

        {items.length > 0 && (
          <div className="max-h-[50vh] sm:max-h-72 overflow-y-auto p-1.5">
            {items.map((item, i) => {
              const active = i === safeIdx;
              if (item.type === "bv") {
                return (
                  <button
                    key="bv"
                    onClick={() => exec(item)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active ? "bg-primary/10" : "hover:bg-muted/60",
                    )}
                  >
                    <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      加载视频{" "}
                      <span className="font-mono font-semibold">{trimmed}</span>
                    </span>
                  </button>
                );
              }
              if (item.type === "id") {
                return (
                  <button
                    key="id"
                    onClick={() => exec(item)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active ? "bg-primary/10" : "hover:bg-muted/60",
                    )}
                  >
                    <Music className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      加载歌曲{" "}
                      <span className="font-mono font-semibold">
                        #{trimmed}
                      </span>
                    </span>
                  </button>
                );
              }
              if (item.type === "song") {
                const s = item.song;
                return (
                  <button
                    key={s.id}
                    onClick={() => exec(item)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left transition-colors",
                      active ? "bg-primary/10" : "hover:bg-muted/60",
                    )}
                  >
                    <Music className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="font-medium truncate block">
                        {s.display_name || s.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        #{s.id} · {s.type}
                      </span>
                    </div>
                  </button>
                );
              }
              if (item.type === "cmd") {
                const c = COMMANDS.find((x) => x.id === item.id)!;
                return (
                  <button
                    key={item.id}
                    onClick={() => exec(item)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active ? "bg-primary/10" : "hover:bg-muted/60",
                    )}
                  >
                    <c.icon className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    <span className="font-medium">{c.label}</span>
                  </button>
                );
              }
              return null;
            })}
          </div>
        )}

        {!busy && items.length === 0 && trimmed && (
          <p className="text-sm text-muted-foreground/50 text-center py-6">
            无结果
          </p>
        )}
      </div>
    </div>
  );
}
