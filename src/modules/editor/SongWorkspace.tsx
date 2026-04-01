// src/modules/editor/SongWorkspace.tsx
import { useState, useRef, useMemo } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Card, CardContent } from "@/ui/card";
import { Badge } from "@/ui/badge";
import {
  X,
  ExternalLink,
  GitMerge,
  Trash2,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import ArtistFields from "./shared/ArtistFields";
import { COPYRIGHT_MAP } from "@/core/types/catalog";
import type {
  Song,
  SongType,
  VideoSummary,
  Copyright,
} from "@/core/types/catalog";

const SONG_TYPES: SongType[] = ["原创", "翻唱", "本家重置", "串烧"];

interface Original {
  displayName: string;
  type: SongType;
  vocalists: string;
  producers: string;
  synthesizers: string;
}

function parseTags(s: string): string[] {
  return s
    .split("、")
    .map((t) => t.trim())
    .filter(Boolean);
}

interface Props {
  song: Song;
  onRefresh: () => void;
  onClose: () => void;
  onMergeSong: (source: Song) => void;
  onRemoveSong: (song: Song) => void;
  onReassignVideo: (bvid: string, parentSong: Song) => void;
  onRemoveVideo: (bvid: string, title: string) => void;
  onEditVideo: (bvid: string) => void;
}

export default function SongWorkspace({
  song,
  onRefresh,
  onClose,
  onMergeSong,
  onRemoveSong,
  onReassignVideo,
  onRemoveVideo,
  onEditVideo,
}: Props) {
  const originalRef = useRef<Original | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [type, setType] = useState<SongType>("原创");
  const [vocalists, setVocalists] = useState("");
  const [producers, setProducers] = useState("");
  const [synthesizers, setSynthesizers] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [videosExpanded, setVideosExpanded] = useState(true);

  // 初始化 / song 变化时重置
  const songIdRef = useRef<number | null>(null);
  if (song.id !== songIdRef.current) {
    songIdRef.current = song.id;
    const orig: Original = {
      displayName: song.display_name ?? "",
      type: song.type as SongType,
      vocalists: (song.vocalists ?? []).map((a) => a.name).join("、"),
      producers: (song.producers ?? []).map((a) => a.name).join("、"),
      synthesizers: (song.synthesizers ?? []).map((a) => a.name).join("、"),
    };
    originalRef.current = orig;
    setDisplayName(orig.displayName);
    setType(orig.type);
    setVocalists(orig.vocalists);
    setProducers(orig.producers);
    setSynthesizers(orig.synthesizers);
  }

  const hasChanges = useMemo(() => {
    const o = originalRef.current;
    if (!o) return false;
    return (
      displayName !== o.displayName ||
      type !== o.type ||
      vocalists !== o.vocalists ||
      producers !== o.producers ||
      synthesizers !== o.synthesizers
    );
  }, [displayName, type, vocalists, producers, synthesizers]);

  const confirmEdit = async () => {
    if (!originalRef.current) return;
    try {
      setSubmitting(true);
      const [vocRes, proRes, synRes] = await Promise.all([
        parseTags(vocalists).length > 0
          ? api.resolveArtists("vocalist", parseTags(vocalists))
          : Promise.resolve({ data: [] }),
        parseTags(producers).length > 0
          ? api.resolveArtists("producer", parseTags(producers))
          : Promise.resolve({ data: [] }),
        parseTags(synthesizers).length > 0
          ? api.resolveArtists("synthesizer", parseTags(synthesizers))
          : Promise.resolve({ data: [] }),
      ]);

      await api.editSong({
        id: song.id,
        display_name: displayName || undefined,
        type,
        vocalist_ids: vocRes.data.map((a) => a.id),
        producer_ids: proRes.data.map((a) => a.id),
        synthesizer_ids: synRes.data.map((a) => a.id),
      });

      const o = originalRef.current;
      const changes: Record<string, { old: string; new: string }> = {};
      if (displayName !== o.displayName)
        changes.display_name = { old: o.displayName, new: displayName };
      if (type !== o.type) changes.type = { old: o.type, new: type };
      if (vocalists !== o.vocalists)
        changes.vocal = { old: o.vocalists, new: vocalists };
      if (producers !== o.producers)
        changes.author = { old: o.producers, new: producers };
      if (synthesizers !== o.synthesizers)
        changes.synthesizer = { old: o.synthesizers, new: synthesizers };

      logEdit({
        targetType: "song",
        targetId: String(song.id),
        action: "edit_song",
        detail: {
          songName: song.name,
          bvids: song.videos?.map((v) => v.bvid) ?? [],
          changes,
        },
      });

      originalRef.current = {
        displayName,
        type,
        vocalists,
        producers,
        synthesizers,
      };
      setConfirmOpen(false);
      toast.success("歌曲信息更新成功");
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "更新失败");
    } finally {
      setSubmitting(false);
    }
  };

  const videos = song.videos ?? [];

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold truncate">
            {song.display_name || song.name}
          </h2>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
            {song.display_name && <span>原名: {song.name}</span>}
            <span>ID: {song.id}</span>
            <span>{song.type}</span>
            <span>{videos.length} 个视频</span>
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

      {/* 编辑表单 */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">显示名称</Label>
              <Input
                value={displayName}
                placeholder="留空使用原名"
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">类型</Label>
              <Select value={type} onValueChange={(v: SongType) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SONG_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ArtistFields
            vocalists={vocalists}
            producers={producers}
            synthesizers={synthesizers}
            onVocalistsChange={setVocalists}
            onProducersChange={setProducers}
            onSynthesizersChange={setSynthesizers}
          />

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

      {/* 关联视频 */}
      {videos.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <button
              className="flex items-center justify-between w-full text-sm font-medium mb-2"
              onClick={() => setVideosExpanded((v) => !v)}
            >
              <span>关联视频 ({videos.length})</span>
              {videosExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {videosExpanded && (
              <div className="space-y-2">
                {videos.map((v) => (
                  <VideoRow
                    key={v.bvid}
                    video={v}
                    onEdit={() => onEditVideo(v.bvid)}
                    onReassign={() => onReassignVideo(v.bvid, song)}
                    onRemove={() => onRemoveVideo(v.bvid, v.title)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 歌曲操作 */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => onMergeSong(song)}
        >
          <GitMerge className="h-3.5 w-3.5" />
          合并到其他歌曲
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={() => onRemoveSong(song)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          从收录移除
        </Button>
      </div>

      {/* 编辑确认 */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="确认更新歌曲信息"
        loading={submitting}
        onConfirm={confirmEdit}
        confirm="确认更新"
      >
        <div className="text-sm space-y-2">
          <p>
            歌曲: {song.name} (ID: {song.id})
          </p>
          <div className="text-xs space-y-1 text-muted-foreground">
            {displayName !== originalRef.current?.displayName && (
              <p>
                显示名: {originalRef.current?.displayName || "（空）"} →{" "}
                {displayName || "（空）"}
              </p>
            )}
            {type !== originalRef.current?.type && (
              <p>
                类型: {originalRef.current?.type} → {type}
              </p>
            )}
            {vocalists !== originalRef.current?.vocalists && (
              <p>
                歌手: {originalRef.current?.vocalists || "（空）"} →{" "}
                {vocalists || "（空）"}
              </p>
            )}
            {producers !== originalRef.current?.producers && (
              <p>
                作者: {originalRef.current?.producers || "（空）"} →{" "}
                {producers || "（空）"}
              </p>
            )}
            {synthesizers !== originalRef.current?.synthesizers && (
              <p>
                引擎: {originalRef.current?.synthesizers || "（空）"} →{" "}
                {synthesizers || "（空）"}
              </p>
            )}
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}

/* ── 视频行 ── */

function VideoRow({
  video,
  onEdit,
  onReassign,
  onRemove,
}: {
  video: VideoSummary;
  onEdit: () => void;
  onReassign: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-md border bg-muted/30 hover:bg-muted/60 transition-colors group">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{video.title}</div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
          <span className="font-mono">{video.bvid}</span>
          {video.copyright != null && (
            <span>{COPYRIGHT_MAP[video.copyright as Copyright] ?? "未知"}</span>
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
