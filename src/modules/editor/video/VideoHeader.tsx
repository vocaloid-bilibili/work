// src/modules/editor/video/VideoHeader.tsx
import { Button } from "@/ui/button";
import { X, ExternalLink } from "lucide-react";
import { COPYRIGHT_MAP } from "@/core/types/constants";
import type { Video } from "@/core/types/catalog";

interface Props {
  video: Video;
  onClose: () => void;
}

export default function VideoHeader({ video, onClose }: Props) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-bold truncate">{video.title}</h2>
        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
          <span className="font-mono">{video.bvid}</span>
          <span>{COPYRIGHT_MAP[video.copyright] ?? "未知"}</span>
          {video.disabled && <span className="text-orange-500">已禁用</span>}
          <a
            href={`https://www.bilibili.com/video/${video.bvid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-blue-500 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            B站
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
