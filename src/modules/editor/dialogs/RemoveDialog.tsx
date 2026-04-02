// src/modules/editor/dialogs/RemoveDialog.tsx
import { useState } from "react";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { logEdit } from "@/core/api/collabEndpoints";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import type { Song } from "@/core/types/catalog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "song" | "video";
  song?: Song | null;
  bvid?: string;
  videoTitle?: string;
  onDone?: () => void;
}

export default function RemoveDialog({
  open,
  onOpenChange,
  mode,
  song,
  bvid,
  videoTitle,
  onDone,
}: Props) {
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    try {
      setLoading(true);
      if (mode === "song" && song) {
        const bvids = song.videos?.map((v) => v.bvid) ?? [];
        void logEdit({
          targetType: "song",
          targetId: String(song.id),
          action: "delete_song",
          detail: { songName: song.name, bvids },
        });
        toast.success(`已提交移除：${song.name}（${bvids.length} 个视频）`);
      } else if (mode === "video" && bvid) {
        void logEdit({
          targetType: "video",
          targetId: bvid,
          action: "delete_video",
          detail: { bvid, title: videoTitle },
        });
        toast.success(`已提交移除：${bvid}`);
      }
      onOpenChange(false);
      onDone?.();
    } catch {
      toast.error("操作失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="确认从收录移除"
      variant="destructive"
      loading={loading}
      onConfirm={confirm}
      confirm="确认移除"
    >
      <div className="space-y-3">
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md text-sm">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-muted-foreground text-xs">
            此操作仅从 collected 数据中移除，<strong>数据库数据不受影响</strong>
            。
          </p>
        </div>

        {mode === "song" && song && (
          <div className="text-sm">
            <p>
              歌曲: <strong>{song.name}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              将移除 {song.videos?.length ?? 0} 个视频的收录行
            </p>
          </div>
        )}
        {mode === "video" && bvid && (
          <div className="text-sm">
            <p>
              视频: <strong className="font-mono">{bvid}</strong>
            </p>
            {videoTitle && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {videoTitle}
              </p>
            )}
          </div>
        )}
      </div>
    </ConfirmDialog>
  );
}
