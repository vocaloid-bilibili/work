// src/modules/editor/components/VideoRow.tsx
import { ArrowRightLeft, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { COPYRIGHT_MAP } from "@/core/types/constants";
import CachedImg from "@/shared/ui/CachedImg";
import type { VideoSummary } from "@/core/types/catalog";

interface Props {
  video: VideoSummary;
  onEdit: () => void;
  onReassign: () => void;
  onRemove: () => void;
}

export function VideoRow({ video, onEdit, onReassign, onRemove }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const menuAction = (fn: () => void) => {
    setMenuOpen(false);
    fn();
  };

  return (
    <div className="group flex items-center gap-3 rounded-xl border bg-card p-3 hover:border-foreground/20 transition-colors">
      {video.thumbnail && (
        <CachedImg
          src={video.thumbnail}
          alt=""
          className="h-12 w-18 shrink-0 rounded-lg object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate leading-snug">
          {video.title}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 flex-wrap">
          <span className="font-mono">{video.bvid}</span>
          {video.copyright != null && (
            <span>· {COPYRIGHT_MAP[video.copyright] ?? "?"}</span>
          )}
          {video.uploader?.name && <span>· {video.uploader.name}</span>}
          {video.disabled && (
            <span className="text-orange-600 font-semibold">· 已禁用</span>
          )}
        </p>
      </div>

      {/* 桌面 */}
      <div className="hidden sm:flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="编辑"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onReassign}
          className="rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="拆分"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onRemove}
          className="rounded-md p-1.5 hover:bg-muted transition-colors text-destructive"
          title="移除"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 移动端 */}
      <div className="relative sm:hidden shrink-0" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-md p-1.5 hover:bg-muted transition-colors text-foreground/60"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 rounded-xl border bg-popover shadow-lg py-1 min-w-32">
            <button
              onClick={() => menuAction(onEdit)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" /> 编辑
            </button>
            <button
              onClick={() => menuAction(onReassign)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" /> 拆分
            </button>
            <button
              onClick={() => menuAction(onRemove)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> 移除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
