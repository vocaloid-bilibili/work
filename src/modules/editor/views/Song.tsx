// src/modules/editor/views/Song.tsx
import { useState, useCallback } from "react";
import {
  ExternalLink,
  GitMerge,
  Plus,
  Trash2,
  Ban,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import { SONG_TYPES } from "@/core/types/constants";
import { useEditor } from "../ctx";
import { useSongForm } from "../hooks/useSongForm";
import { useRelations } from "../hooks/useRelations";
import { buildCollectedRow } from "../utils/collected";
import { Section } from "../components/Section";
import { Input } from "../components/Input";
import { Btn } from "../components/Btn";
import { ArtistFields } from "../components/ArtistFields";
import { VideoRow } from "../components/VideoRow";
import { RelationsEditor } from "../components/RelationsEditor";
import { Confirm } from "../components/Confirm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import type { Song, VideoSummary, SongType } from "@/core/types/catalog";

/* ── Header：身份信息 + 内联编辑 display name / type ── */

function SongHeader({
  song,
  form,
}: {
  song: Song;
  form: ReturnType<typeof useSongForm>;
}) {
  const name = song.display_name || song.name;
  const videos = song.videos ?? [];
  const activeCount = videos.filter((v) => !v.disabled).length;
  const disabledCount = videos.filter((v) => v.disabled).length;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <h2 className="text-xl font-black tracking-tight wrap-break-word">
          {name}
        </h2>
        <div className="flex items-center gap-x-2 gap-y-1 flex-wrap text-xs text-muted-foreground">
          {song.display_name && (
            <span className="wrap-break-word">{song.name}</span>
          )}
          <span>#{song.id}</span>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground/60">
            {song.type}
          </span>
          <span>
            {activeCount} 视频
            {disabledCount > 0 && (
              <span className="text-orange-600"> + {disabledCount} 已停止</span>
            )}
          </span>
          <a
            href={`https://vocabili.top/song/${song.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-blue-500 hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> 主站
          </a>
        </div>
      </div>

      {/* 内联编辑：显示名称 + 类型 */}
      <div className="flex items-end gap-3">
        <div className="flex-1 min-w-0">
          <label className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
            显示名称
          </label>
          <Input
            className="mt-1 h-8 text-sm"
            value={form.displayName}
            placeholder="留空使用原名"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              form.setDisplayName(e.target.value)
            }
          />
        </div>
        <div className="w-28 shrink-0">
          <label className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
            类型
          </label>
          <Select
            value={form.type}
            onValueChange={(v: SongType) => form.setType(v)}
          >
            <SelectTrigger className="mt-1 h-8 text-sm">
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
    </div>
  );
}

/* ── 艺人区块 ── */

function ArtistSection({
  song,
  form,
}: {
  song: Song;
  form: ReturnType<typeof useSongForm>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const doSave = async () => {
    const ok = await form.save();
    if (ok) {
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Section title="艺人">
        <div className="space-y-3">
          <ArtistFields
            vocalists={form.vocalists}
            producers={form.producers}
            synthesizers={form.synthesizers}
            onVocalistsChange={form.setVocalists}
            onProducersChange={form.setProducers}
            onSynthesizersChange={form.setSynthesizers}
          />
          {form.dirty && (
            <Btn
              variant="primary"
              className="w-full"
              loading={form.saving}
              onClick={() => setConfirmOpen(true)}
            >
              保存更改
            </Btn>
          )}
        </div>
      </Section>

      <Confirm
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="确认更新歌曲信息"
        loading={form.saving}
        onConfirm={doSave}
        confirm="确认更新"
      >
        <div className="text-sm space-y-2">
          <p>
            歌曲：
            <strong className="wrap-break-word">{song.name}</strong>
          </p>
          <div className="text-xs text-muted-foreground space-y-0.5">
            {Object.entries(form.diff()).map(([k, d]) => (
              <p key={k}>
                {k}：{d.old} → {d.new}
              </p>
            ))}
          </div>
        </div>
      </Confirm>
    </>
  );
}

/* ── 已停止视频（内联恢复） ── */

function StoppedVideoItem({
  video,
  onEdit,
  onRestore,
  restoring,
}: {
  video: VideoSummary;
  onEdit: () => void;
  onRestore: () => void;
  restoring: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground wrap-break-word leading-snug">
          {video.title}
        </p>
        <code className="text-[10px] text-muted-foreground/50 font-mono">
          {video.bvid}
        </code>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="rounded-lg px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          详情
        </button>
        <Btn
          size="sm"
          variant="ghost"
          loading={restoring}
          onClick={onRestore}
          icon={<RotateCcw className="h-3 w-3" />}
        >
          恢复
        </Btn>
      </div>
    </div>
  );
}

/* ── 视频列表 ── */

function VideoListSection({
  song,
  onChanged,
}: {
  song: Song;
  onChanged: () => void;
}) {
  const { openVideo, push } = useEditor();
  const [rmBvid, setRmBvid] = useState<string | null>(null);
  const [rmTitle, setRmTitle] = useState("");
  const [rmLoading, setRmLoading] = useState(false);
  const [showStopped, setShowStopped] = useState(false);
  const [restoringBvid, setRestoringBvid] = useState<string | null>(null);

  const videos = song.videos ?? [];
  const activeVideos = videos.filter((v) => !v.disabled);
  const disabledVideos = videos.filter((v) => v.disabled);

  const doRemove = async () => {
    if (!rmBvid) return;
    setRmLoading(true);
    try {
      await api.deleteVideo(rmBvid);
      await logEdit({
        targetType: "video",
        targetId: rmBvid,
        action: "delete_video",
        detail: {
          bvid: rmBvid,
          title: rmTitle,
          songId: song.id,
          songName: song.name,
        },
      });
      toast.success(`已停止收录：${rmBvid}`);
      setRmBvid(null);
      onChanged();
    } catch {
      toast.error("操作失败");
    } finally {
      setRmLoading(false);
    }
  };

  const doRestore = async (video: VideoSummary) => {
    setRestoringBvid(video.bvid);
    try {
      await api.restoreVideo(video.bvid);

      let bilibili: api.BilibiliVideoInfo | null = null;
      try {
        bilibili = await api.fetchBilibiliVideo(video.bvid);
      } catch {
        /* best-effort */
      }

      const collectedRow = buildCollectedRow(video, song, bilibili);
      await logEdit({
        targetType: "video",
        targetId: video.bvid,
        action: "restore_video",
        detail: {
          bvid: video.bvid,
          title: video.title,
          songId: song.id,
          songName: song.name,
          collectedRow,
        },
      });
      toast.success(`已恢复收录：${video.bvid}`);
      onChanged();
    } catch {
      toast.error("恢复失败");
    } finally {
      setRestoringBvid(null);
    }
  };

  if (videos.length === 0) return null;

  return (
    <>
      <Section title={`视频 (${activeVideos.length})`} noPad>
        <div className="p-3 sm:p-4 space-y-2">
          {activeVideos.map((v) => (
            <VideoRow
              key={v.bvid}
              video={v}
              onEdit={() => openVideo(v.bvid)}
              onReassign={() =>
                push({
                  id: "reassign",
                  bvid: v.bvid,
                  title: v.title,
                  parent: song,
                })
              }
              onRemove={() => {
                setRmBvid(v.bvid);
                setRmTitle(v.title);
              }}
            />
          ))}

          {disabledVideos.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setShowStopped((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                {showStopped ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                已停止 ({disabledVideos.length})
              </button>
              {showStopped && (
                <div className="mt-2 space-y-1.5">
                  {disabledVideos.map((v) => (
                    <StoppedVideoItem
                      key={v.bvid}
                      video={v}
                      onEdit={() => openVideo(v.bvid)}
                      onRestore={() => doRestore(v)}
                      restoring={restoringBvid === v.bvid}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      <Confirm
        open={!!rmBvid}
        onOpenChange={(v) => {
          if (!v) setRmBvid(null);
        }}
        title="确认停止收录"
        variant="destructive"
        loading={rmLoading}
        onConfirm={doRemove}
        confirm="确认停止"
      >
        <div className="text-sm space-y-2">
          <p>
            视频：
            <code className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-xs">
              {rmBvid}
            </code>
          </p>
          {rmTitle && (
            <p className="text-xs text-muted-foreground wrap-break-word">
              {rmTitle}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            将从 collected 移除并标记为不收录，历史数据保留
          </p>
        </div>
      </Confirm>
    </>
  );
}

/* ── 底部操作 ── */

function ActionBar({
  hasActiveVideos,
  onAddVideo,
  onMerge,
  onDisable,
  onHardDelete,
}: {
  hasActiveVideos: boolean;
  onAddVideo: () => void;
  onMerge: () => void;
  onDisable: () => void;
  onHardDelete: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Btn icon={<Plus className="h-3.5 w-3.5" />} onClick={onAddVideo}>
          添加视频
        </Btn>
        <Btn icon={<GitMerge className="h-3.5 w-3.5" />} onClick={onMerge}>
          合并到其他歌曲
        </Btn>
      </div>

      <div className="border-t border-dashed pt-3 flex items-center gap-2">
        {hasActiveVideos && (
          <Btn
            variant="danger"
            size="sm"
            icon={<Ban className="h-3 w-3" />}
            onClick={onDisable}
          >
            停止收录全部
          </Btn>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
              <MoreHorizontal className="h-3.5 w-3.5" />
              更多
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onHardDelete}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              彻底删除歌曲
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/* ── 主视图 ── */

export function SongView({ song }: { song: Song }) {
  const { home, push, replace } = useEditor();
  const form = useSongForm(song);
  const rels = useRelations(song);

  const [disableOpen, setDisableOpen] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);

  const [hardDeleteOpen, setHardDeleteOpen] = useState(false);
  const [hardDeleteLoading, setHardDeleteLoading] = useState(false);

  const activeVideos = (song.videos ?? []).filter((v) => !v.disabled);
  const hasActiveVideos = activeVideos.length > 0;

  const refresh = useCallback(async () => {
    try {
      const r = await api.selectSong(song.id, true);
      replace({ id: "song", song: r.data });
    } catch {
      /* silent */
    }
  }, [song.id, replace]);

  const doDisableSong = async () => {
    setDisableLoading(true);
    try {
      for (const v of activeVideos) {
        await api.deleteVideo(v.bvid);
        await logEdit({
          targetType: "video",
          targetId: v.bvid,
          action: "delete_video",
          detail: {
            bvid: v.bvid,
            title: v.title,
            songId: song.id,
            songName: song.name,
          },
        });
      }
      toast.success(
        `已停止收录「${song.display_name || song.name}」的 ${activeVideos.length} 个视频`,
      );
      setDisableOpen(false);
      refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "操作失败");
    } finally {
      setDisableLoading(false);
    }
  };

  const doHardDeleteSong = async () => {
    setHardDeleteLoading(true);
    try {
      const bvids = (song.videos ?? []).map((v) => v.bvid);
      await api.deleteSong(song.id);
      await logEdit({
        targetType: "song",
        targetId: String(song.id),
        action: "delete_song",
        detail: { songId: song.id, songName: song.name, bvids },
      });
      toast.success(`已彻底删除：${song.name}`);
      setHardDeleteOpen(false);
      home();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "操作失败");
    } finally {
      setHardDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <SongHeader song={song} form={form} />

      <ArtistSection song={song} form={form} />

      <Section title="关联作品">
        <RelationsEditor r={rels} />
      </Section>

      <VideoListSection song={song} onChanged={refresh} />

      <ActionBar
        hasActiveVideos={hasActiveVideos}
        onAddVideo={() => push({ id: "add", preset: song })}
        onMerge={() => push({ id: "merge-song", preset: song })}
        onDisable={() => setDisableOpen(true)}
        onHardDelete={() => setHardDeleteOpen(true)}
      />

      <Confirm
        open={disableOpen}
        onOpenChange={setDisableOpen}
        title="确认停止收录"
        variant="destructive"
        loading={disableLoading}
        onConfirm={doDisableSong}
        confirm="确认停止"
      >
        <div className="text-sm space-y-2">
          <p>
            歌曲：<strong className="wrap-break-word">{song.name}</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            将停止收录 {activeVideos.length} 个视频，从 collected
            移除并标记为不收录，历史数据保留
          </p>
        </div>
      </Confirm>

      <Confirm
        open={hardDeleteOpen}
        onOpenChange={setHardDeleteOpen}
        title="确认彻底删除"
        variant="destructive"
        loading={hardDeleteLoading}
        onConfirm={doHardDeleteSong}
        confirm="确认删除"
      >
        <div className="text-sm space-y-2">
          <p>
            歌曲：<strong className="wrap-break-word">{song.name}</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            将删除 {(song.videos ?? []).length} 个视频
          </p>
          <p className="text-xs text-destructive font-medium">
            数据库记录将被永久删除（包括快照、排名关联等），不可恢复
          </p>
        </div>
      </Confirm>
    </div>
  );
}
