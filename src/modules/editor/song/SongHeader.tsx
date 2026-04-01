// src/modules/editor/song/SongHeader.tsx
import { Button } from "@/ui/button";
import { X, ExternalLink } from "lucide-react";
import type { Song } from "@/core/types/catalog";

interface Props {
  song: Song;
  onClose: () => void;
}

export default function SongHeader({ song, onClose }: Props) {
  const vids = song.videos?.length ?? 0;
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-bold truncate">
          {song.display_name || song.name}
        </h2>
        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
          {song.display_name && <span>原名: {song.name}</span>}
          <span>ID: {song.id}</span>
          <span>{song.type}</span>
          <span>{vids} 个视频</span>
          <a
            href={`https://vocabili.top/song/${song.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-blue-500 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            主站
          </a>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
