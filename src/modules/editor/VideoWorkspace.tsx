// src/modules/editor/VideoWorkspace.tsx
import { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Card, CardContent } from "@/ui/card";
import { X, ExternalLink, ArrowRightLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import SongInfoCard from "./shared/SongInfoCard";
import { COPYRIGHT_MAP } from "@/core/types/catalog";
import type { Video, Song, Copyright } from "@/core/types/catalog";

const COPYRIGHT_OPTIONS = [
  { label: "自制", value: 1 },
  { label: "转载", value: 2 },
  { label: "未定", value: 3 },
  { label: "转载投自制", value: 101 },
  { label: "自制投转载", value: 100 },
];

interface Original {
  title: string;
  copyright: number;
  disabled: boolean;
}

interface Props {
  video: Video;
  onClose: () => void;
  onReassign: (bvid: string, parentSong: Song | null) => void;
  onRemove: (bvid: string, title: string) => void;
  onOpenSong: (songId: number) => void;
}

export default function VideoWorkspace({
  video,
  onClose,
  onReassign,
  onRemove,
  onOpenSong,
}: Props) {
  const originalRef = useRef<Original | null>(null);
  const [parentSong, setParentSong] = useState<Song | null>(null);
  const [title, setTitle] = useState("");
  const [copyright, setCopyright] = useState(1);
  const [disabled, setDisabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 初始化
  const bvidRef = useRef("");
  if (video.bvid !== bvidRef.current) {
    bvidRef.current = video.bvid;
    const orig: Original = {
      title: video.title,
      copyright: video.copyright ?? 3,
      disabled: video.disabled ?? false,
    };
    originalRef.current = orig;
    setTitle(orig.title);
    setCopyright(orig.copyright);
    setDisabled(orig.disabled);
  }

  // 加载父歌曲
  useEffect(() => {
    if (!video.song_id) {
      setParentSong(null);
      return;
    }
    let c = false;
    api
      .selectSong(video.song_id)
      .then((r) => {
        if (!c) setParentSong(r.data);
      })
      .catch(() => {
        if (!c) setParentSong(null);
      });
    return () => {
      c = true;
    };
  }, [video.song_id]);

  const hasChanges = useMemo(() => {
    const o = originalRef.current;
    if (!o) return false;
    return (
      title !== o.title || copyright !== o.copyright || disabled !== o.disabled
    );
  }, [title, copyright, disabled]);

  const confirmEdit = async () => {
    if (!originalRef.current) return;
    try {
      setSubmitting(true);
      await api.editVideo({ bvid: video.bvid, title, copyright, disabled });

      const o = originalRef.current;
      const changes: Record<string, { old: unknown; new: unknown }> = {};
      if (title !== o.title) changes.title = { old: o.title, new: title };
      if (copyright !== o.copyright)
        changes.copyright = { old: o.copyright, new: copyright };
      if (disabled !== o.disabled)
        changes.disabled = { old: o.disabled, new: disabled };

      logEdit({
        targetType: "video",
        targetId: video.bvid,
        action: "edit_video",
        detail: { bvid: video.bvid, title: video.title, changes },
      });

      originalRef.current = { title, copyright, disabled };
      setConfirmOpen(false);
      toast.success("视频信息更新成功");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "更新失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold truncate">{video.title}</h2>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
            <span className="font-mono">{video.bvid}</span>
            <span>{COPYRIGHT_MAP[video.copyright as Copyright] ?? "未知"}</span>
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

      {/* 所属歌曲 */}
      {parentSong && (
        <div
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onOpenSong(parentSong.id)}
        >
          <SongInfoCard song={parentSong} />
          <p className="text-[10px] text-muted-foreground mt-1">
            点击切换到歌曲编辑
          </p>
        </div>
      )}

      {/* 编辑表单 */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">视频标题</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            <p className="text-[10px] text-muted-foreground">
              标题修改会被下次爬虫覆盖
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">版权类型</Label>
            <Select
              value={String(copyright)}
              onValueChange={(v) => setCopyright(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COPYRIGHT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
            <div>
              <Label className="text-xs">禁用视频</Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                禁用后不参与排名，数据保留
              </p>
            </div>
            <Switch checked={disabled} onCheckedChange={setDisabled} />
          </div>

          <Button
            className="w-full"
            onClick={() =>
              hasChanges ? setConfirmOpen(true) : toast.info("没有变化")
            }
            disabled={submitting || !hasChanges}
          >
            {hasChanges ? "提交更新" : "无变化"}
          </Button>
        </CardContent>
      </Card>

      {/* 视频操作 */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => onReassign(video.bvid, parentSong)}
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          拆分/移动到其他歌曲
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={() => onRemove(video.bvid, video.title)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          从收录移除
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="确认更新视频信息"
        loading={submitting}
        onConfirm={confirmEdit}
        confirm="确认更新"
      >
        <div className="text-sm space-y-1">
          <p className="font-mono">{video.bvid}</p>
          <div className="text-xs text-muted-foreground">
            {title !== originalRef.current?.title && (
              <p>
                标题: {originalRef.current?.title} → {title}
              </p>
            )}
            {copyright !== originalRef.current?.copyright && (
              <p>
                版权:{" "}
                {COPYRIGHT_MAP[originalRef.current?.copyright as Copyright] ??
                  "?"}{" "}
                → {COPYRIGHT_MAP[copyright as Copyright] ?? "?"}
              </p>
            )}
            {disabled !== originalRef.current?.disabled && (
              <p>
                禁用: {originalRef.current?.disabled ? "是" : "否"} →{" "}
                {disabled ? "是" : "否"}
              </p>
            )}
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
