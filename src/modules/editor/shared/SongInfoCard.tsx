// src/modules/editor/shared/SongInfoCard.tsx
import type { Song } from "@/core/types/catalog";

export default function SongInfoCard({ song }: { song: Song }) {
  const vids = song.videos?.length ?? 0;
  const vocalists = song.vocalists?.map((a) => a.name).join("、");
  const producers = song.producers?.map((a) => a.name).join("、");
  const synths = song.synthesizers?.map((a) => a.name).join("、");

  return (
    <div className="p-3 bg-muted/50 rounded-md space-y-1 text-sm">
      <div className="font-medium">{song.display_name || song.name}</div>
      <div className="text-xs text-muted-foreground space-y-0.5">
        {song.display_name && <div>原名: {song.name}</div>}
        <div>
          ID: {song.id} · {song.type}
          {vids > 0 && ` · ${vids} 个视频`}
        </div>
        {vocalists && <div>歌手: {vocalists}</div>}
        {producers && <div>作者: {producers}</div>}
        {synths && <div>引擎: {synths}</div>}
      </div>
    </div>
  );
}
