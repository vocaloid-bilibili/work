// src/modules/editor/song/relations/RelationRow.tsx
import { Button } from "@/ui/button";
import { Trash2 } from "lucide-react";
import CachedImg from "@/shared/ui/CachedImg";
import type { RelatedSong } from "./types";

interface Props {
  song: RelatedSong;
  onRemove: () => void;
}

export default function RelationRow({ song, onRemove }: Props) {
  const name = song.display_name?.trim() || song.name;
  return (
    <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
      {song.thumbnail && (
        <CachedImg
          src={song.thumbnail}
          alt=""
          className="h-8 w-11 shrink-0 rounded object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">
          #{song.id} · {song.type}
          {song.producers?.length
            ? ` · ${song.producers.map((p) => p.name).join(", ")}`
            : ""}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
