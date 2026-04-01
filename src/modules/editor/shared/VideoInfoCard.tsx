// src/modules/editor/shared/VideoInfoCard.tsx
import type { Video, Song } from "@/core/types/catalog";
import { COPYRIGHT_MAP } from "@/core/types/catalog";
import type { Copyright } from "@/core/types/catalog";

interface Props {
  video: Video;
  parentSong?: Song | null;
}

export default function VideoInfoCard({ video, parentSong }: Props) {
  const songRef = parentSong ?? video.song;

  return (
    <div className="p-3 bg-muted/50 rounded-md space-y-1 text-sm">
      <div className="font-medium truncate">{video.title}</div>
      <div className="text-xs text-muted-foreground space-y-0.5">
        <div className="font-mono">{video.bvid}</div>
        <div>
          版权: {COPYRIGHT_MAP[video.copyright as Copyright] ?? "未知"}
          {video.disabled && " · 已禁用"}
        </div>
        {video.uploader && (
          <div>
            投稿人: {video.uploader.name} (UID: {video.uploader.id})
          </div>
        )}
        {songRef && (
          <div>
            所属歌曲: {songRef.display_name || songRef.name} (ID: {songRef.id})
          </div>
        )}
      </div>
    </div>
  );
}
