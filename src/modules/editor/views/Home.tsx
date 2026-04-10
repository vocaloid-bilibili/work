// src/modules/editor/views/Home.tsx
import { useState, useRef, useEffect } from "react";
import { GitMerge, Users, Tv, Plus, Search, Loader2 } from "lucide-react";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import * as api from "@/core/api/mainEndpoints";
import { useEditor } from "../ctx";
import { cn } from "@/ui/cn";
import type { Song } from "@/core/types/catalog";

const ACTIONS = [
  {
    id: "add" as const,
    icon: Plus,
    title: "添加收录",
    desc: "添加视频到歌曲或创建新歌曲",
    accent: "text-blue-500 bg-blue-500/10",
  },
  {
    id: "merge-song" as const,
    icon: GitMerge,
    title: "合并歌曲",
    desc: "转移视频和艺人到目标歌曲",
    accent: "text-purple-500 bg-purple-500/10",
  },
  {
    id: "merge-artist" as const,
    icon: Users,
    title: "合并艺人",
    desc: "转移关联到目标艺人",
    accent: "text-indigo-500 bg-indigo-500/10",
  },
  {
    id: "board" as const,
    icon: Tv,
    title: "榜单视频",
    desc: "设置榜单期对应投稿视频",
    accent: "text-emerald-500 bg-emerald-500/10",
  },
];

export function HomeView() {
  const { push, openSong, openVideo } = useEditor();
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hints, setHints] = useState<Song[]>([]);
  const dv = useDebounce(input, 400);
  const wrap = useRef<HTMLDivElement>(null);
  useClickOutside(wrap, () => setOpen(false));

  const trimmed = input.trim();
  const isBv = /^BV[a-zA-Z0-9]{10}$/i.test(trimmed);
  const isId = /^\d+$/.test(trimmed) && trimmed.length > 0;

  useEffect(() => {
    if (!dv || dv.trim().length < 1 || isBv || isId) {
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

  const go = (type: "song" | "video", id: string | number) => {
    if (type === "video") openVideo(String(id));
    else openSong(Number(id));
    setInput("");
    setOpen(false);
    setHints([]);
  };

  const pick = (s: Song) => {
    openSong(s.id);
    setInput("");
    setOpen(false);
    setHints([]);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    if (isBv) go("video", trimmed);
    else if (isId) go("song", trimmed);
    else if (hints.length === 1) pick(hints[0]);
  };

  const showDrop = open && (isBv || isId || hints.length > 0 || busy);

  return (
    <div className="space-y-8">
      {/* 搜索栏 */}
      <div className="relative" ref={wrap}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <input
            className="w-full h-12 rounded-2xl border border-border/60 bg-card pl-11 pr-4 text-sm shadow-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all"
            placeholder="搜索歌曲名、输入歌曲 ID 或 BV 号…"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setInput(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKey}
          />
          {busy && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground/40" />
          )}
        </div>

        {showDrop && (
          <div className="absolute top-full left-0 z-50 w-full mt-2 rounded-2xl border bg-popover shadow-xl overflow-hidden">
            <div className="max-h-72 overflow-y-auto p-1.5">
              {isBv && (
                <button
                  onClick={() => go("video", trimmed)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                >
                  <span className="text-muted-foreground">加载视频</span>
                  <span className="font-mono font-semibold">{trimmed}</span>
                </button>
              )}
              {isId && (
                <button
                  onClick={() => go("song", trimmed)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                >
                  <span className="text-muted-foreground">按 ID 加载歌曲</span>
                  <span className="font-mono font-semibold">#{trimmed}</span>
                </button>
              )}
              {busy && hints.length === 0 && !isBv && !isId && (
                <div className="flex items-center justify-center gap-2 p-5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> 搜索中…
                </div>
              )}
              {!isBv &&
                !isId &&
                hints.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => pick(s)}
                    className="flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-sm text-left hover:bg-accent transition-colors"
                  >
                    <span className="font-medium truncate">
                      {s.display_name || s.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                      <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium">
                        {s.type}
                      </span>
                      {s.producers?.length ? (
                        <span>
                          P: {s.producers.map((p) => p.name).join(", ")}
                        </span>
                      ) : null}
                      <span className="text-muted-foreground/40">#{s.id}</span>
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 快捷操作 */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider">
          快捷操作
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => push({ id: a.id })}
              className="group flex items-start gap-3.5 rounded-2xl border border-border/40 p-5 text-left transition-all hover:border-border hover:shadow-sm active:scale-[0.99]"
            >
              <div
                className={cn(
                  "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  a.accent,
                )}
              >
                <a.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5 leading-relaxed">
                  {a.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
