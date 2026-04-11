// src/modules/editor/components/SongCard.tsx
import { ExternalLink } from "lucide-react";
import type { Song } from "@/core/types/catalog";

export function SongCard({
  song,
  onClick,
  compact,
}: {
  song: Song;
  onClick?: () => void;
  compact?: boolean;
}) {
  const name = song.display_name || song.name;
  const voc = song.vocalists?.map((a) => a.name).join("、");
  const pro = song.producers?.map((a) => a.name).join("、");

  return (
    <div
      onClick={onClick}
      className={`rounded-xl bg-muted/40 border p-3 sm:p-3.5 space-y-1.5 ${
        onClick ? "cursor-pointer hover:bg-muted/60 transition-colors" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm font-bold wrap-break-word min-w-0 flex-1">
          {name}
        </span>
        <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground/60">
          {song.type}
        </span>
        {!compact && (
          <a
            href={`https://vocabili.top/song/${song.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-blue-500 hover:text-blue-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className="text-[11px] text-muted-foreground flex items-center gap-x-1.5 gap-y-0.5 flex-wrap">
        <span>#{song.id}</span>
        {song.display_name && <span>· {song.name}</span>}
        {song.videos?.length ? <span>· {song.videos.length} 视频</span> : null}
      </div>
      {(pro || voc) && (
        <div className="text-[11px] text-muted-foreground space-y-0.5">
          {pro && (
            <p className="wrap-break-word">
              <span className="font-medium text-foreground/50">P</span> {pro}
            </p>
          )}
          {voc && (
            <p className="wrap-break-word">
              <span className="font-medium text-foreground/50">V</span> {voc}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
