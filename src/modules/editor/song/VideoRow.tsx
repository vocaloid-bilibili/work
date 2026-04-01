// src/modules/editor/song/VideoRow.tsx
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { ArrowRightLeft } from "lucide-react";
import { COPYRIGHT_MAP } from "@/core/types/constants";
import type { VideoSummary } from "@/core/types/catalog";

interface Props {
  video: VideoSummary;
  onEdit: () => void;
  onReassign: () => void;
  onRemove: () => void;
}

export default function VideoRow({
  video,
  onEdit,
  onReassign,
  onRemove,
}: Props) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-md border bg-muted/30 hover:bg-muted/60 transition-colors group">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{video.title}</div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
          <span className="font-mono">{video.bvid}</span>
          {video.copyright != null && (
            <span>{COPYRIGHT_MAP[video.copyright] ?? "未知"}</span>
          )}
          {video.uploader?.name && <span>{video.uploader.name}</span>}
          {video.disabled && (
            <Badge
              variant="outline"
              className="text-[9px] h-4 px-1 text-orange-600 border-orange-300"
            >
              已禁用
            </Badge>
          )}
        </div>
      </div>
      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onEdit}
        >
          编辑
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onReassign}
        >
          <ArrowRightLeft className="h-3 w-3 mr-1" />
          拆分
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          移除
        </Button>
      </div>
    </div>
  );
}
