// src/modules/editor/components/VideoRow.tsx
import { ArrowRightLeft, Pencil, Trash2 } from "lucide-react";
import { COPYRIGHT_MAP } from "@/core/types/constants";
import CachedImg from "@/shared/ui/CachedImg";
import type { VideoSummary } from "@/core/types/catalog";

interface Props {
  video: VideoSummary;
  onEdit: () => void;
  onReassign?: () => void;
  onRemove?: () => void;
}

export function VideoRow({ video, onEdit, onReassign, onRemove }: Props) {
  const hasActions = !!(onReassign || onRemove);

  return (
    <div
      className="rounded-xl border bg-card p-3 space-y-2 hover:border-foreground/20 transition-colors cursor-pointer"
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onEdit()}
    >
      {/* 缩略图 + 标题 */}
      <div className="flex gap-3">
        {video.thumbnail && (
          <CachedImg
            src={video.thumbnail}
            alt=""
            className="w-24 aspect-video shrink-0 rounded-lg object-cover bg-muted"
          />
        )}
        <p className="text-sm font-medium leading-snug wrap-break-word min-w-0 flex-1">
          {video.title}
        </p>
      </div>

      <div className="flex items-center gap-x-2.5 gap-y-1 flex-wrap text-xs text-muted-foreground">
        <code className="select-all bg-muted/50 px-1.5 py-0.5 rounded text-[11px] font-mono">
          {video.bvid}
        </code>
        {video.copyright != null && (
          <span>{COPYRIGHT_MAP[video.copyright] ?? "?"}</span>
        )}
        {video.uploader?.name && <span>{video.uploader.name}</span>}
        {video.disabled && (
          <span className="text-orange-600 font-semibold">已停止收录</span>
        )}
      </div>

      {hasActions && (
        <div className="flex items-center gap-1 pt-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-3 w-3" /> 编辑
          </button>
          {onReassign && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReassign();
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowRightLeft className="h-3 w-3" /> 拆分
            </button>
          )}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium hover:bg-muted transition-colors text-destructive"
            >
              <Trash2 className="h-3 w-3" /> 停止
            </button>
          )}
        </div>
      )}
    </div>
  );
}
