// src/modules/editor/views/Song.tsx
import { useState, useCallback } from "react";
import {
  ExternalLink,
  GitMerge,
  Plus,
  Trash2,
  Ban,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import { SONG_TYPES } from "@/core/types/constants";
import { cn } from "@/ui/cn";
import { useEditor } from "../ctx";
import { useSongForm } from "../hooks/useSongForm";
import { useRelations } from "../hooks/useRelations";
import { Section } from "../components/Section";
import { Field } from "../components/Field";
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
import type { Song, SongType } from "@/core/types/catalog";

function SongHeader({ song }: { song: Song }) {
  const name = song.display_name || song.name;
  const videos = song.videos ?? [];
  const activeVideos = videos.filter((v) => !v.disabled);
  const disabledVideos = videos.filter((v) => v.disabled);

  return (
    <div className="space-y-1.5">
      <h2 className="text-xl font-black tracking-tight truncate">{name}</h2>
      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
        {song.display_name && <span>{song.name}</span>}
        <span>#{song.id}</span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground/60">
          {song.type}
        </span>
        <span>
          {activeVideos.length} 视频
          {disabledVideos.length > 0 && (
            <span className="text-orange-600">
              {" "}
              + {disabledVideos.length} 已停止
            </span>
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
  );
}

function SongFormSection({
  song,
  onSaved,
}: {
  song: Song;
  onSaved: () => void;
}) {
  const form = useSongForm(song);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const doSave = async () => {
    const ok = await form.save();
    if (ok) {
      setConfirmOpen(false);
      onSaved();
    }
  };

  return (
    <>
      <Section title="基本信息">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="显示名称">
              <Input
                value={form.displayName}
                placeholder="留空使用原名"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  form.setDisplayName(e.target.value)
                }
              />
            </Field>
            <Field label="类型">
              <Select
                value={form.type}
                onValueChange={(v: SongType) => form.setType(v)}
              >
                <SelectTrigger className="h-9">
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
            </Field>
          </div>
          <ArtistFields
            vocalists={form.vocalists}
            producers={form.producers}
            synthesizers={form.synthesizers}
            onVocalistsChange={form.setVocalists}
            onProducersChange={form.setProducers}
            onSynthesizersChange={form.setSynthesizers}
          />
          <Btn
            variant="primary"
            className="w-full"
            disabled={!form.dirty || form.saving}
            loading={form.saving}
            onClick={() =>
              form.dirty ? setConfirmOpen(true) : toast.info("没有变化")
            }
          >
            {form.dirty ? "保存更改" : "无变化"}
          </Btn>
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
            歌曲：<strong>{song.name}</strong>
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

function VideoListSection({
  song,
  onRemoved,
}: {
  song: Song;
  onRemoved: () => void;
}) {
  const { openVideo, push } = useEditor();
  const [expanded, setExpanded] = useState(true);
  const [rmBvid, setRmBvid] = useState<string | null>(null);
  const [rmTitle, setRmTitle] = useState("");
  const [rmLoading, setRmLoading] = useState(false);
  const videos = song.videos ?? [];
  const activeVideos = videos.filter((v) => !v.disabled);
  const disabledVideos = videos.filter((v) => v.disabled);

  if (videos.length === 0) return null;

  const doRemove = async () => {
    if (!rmBvid) return;
    setRmLoading(true);
    try {
      await api.deleteVideo(rmBvid);
      await logEdit({
        targetType: "video",
        targetId: rmBvid,
        action: "delete_video",
        detail: { bvid: rmBvid, title: rmTitle },
      });
      toast.success(`已停止收录：${rmBvid}`);
      setRmBvid(null);
      onRemoved();
    } catch {
      toast.error("操作失败");
    } finally {
      setRmLoading(false);
    }
  };

  return (
    <>
      <Section
        title={`关联视频（${activeVideos.length}${disabledVideos.length ? ` + ${disabledVideos.length} 已停止` : ""}）`}
        noPad
        actions={
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </button>
        }
      >
        {expanded && (
          <div className="p-4 space-y-2">
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
              <>
                <div className="text-xs text-muted-foreground pt-2 pb-1 border-t">
                  已停止收录
                </div>
                {disabledVideos.map((v) => (
                  <div key={v.bvid} className="opacity-50">
                    <VideoRow video={v} onEdit={() => openVideo(v.bvid)} />
                  </div>
                ))}
              </>
            )}
          </div>
        )}
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
        <div className="text-sm">
          <p>
            视频：<strong className="font-mono">{rmBvid}</strong>
          </p>
          {rmTitle && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {rmTitle}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            将从 collected 移除并标记为不收录
          </p>
        </div>
      </Confirm>
    </>
  );
}

export function SongView({ song }: { song: Song }) {
  const { home, push, replace } = useEditor();
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
      await api.disableSong(song.id);
      const bvids = activeVideos.map((v) => v.bvid);
      await logEdit({
        targetType: "song",
        targetId: String(song.id),
        action: "disable_song",
        detail: { songName: song.name, bvids },
      });
      toast.success(`已停止收录：${song.name}`);
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
        detail: { songName: song.name, bvids },
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
      <SongHeader song={song} />
      <SongFormSection song={song} onSaved={refresh} />

      <Section title="关联作品">
        <RelationsEditor r={rels} />
      </Section>

      <VideoListSection song={song} onRemoved={refresh} />

      <div className="flex flex-wrap gap-2 pt-1">
        <Btn
          icon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => push({ id: "add", preset: song })}
        >
          添加视频
        </Btn>
        <Btn
          icon={<GitMerge className="h-3.5 w-3.5" />}
          onClick={() => push({ id: "merge-song", preset: song })}
        >
          合并到其他歌曲
        </Btn>
        {hasActiveVideos && (
          <Btn
            variant="danger"
            icon={<Ban className="h-3.5 w-3.5" />}
            onClick={() => setDisableOpen(true)}
          >
            停止收录
          </Btn>
        )}
        <Btn
          variant="danger"
          icon={<Trash2 className="h-3.5 w-3.5" />}
          onClick={() => setHardDeleteOpen(true)}
        >
          彻底删除
        </Btn>
      </div>

      {/* 停止收录确认 */}
      <Confirm
        open={disableOpen}
        onOpenChange={setDisableOpen}
        title="确认停止收录"
        variant="destructive"
        loading={disableLoading}
        onConfirm={doDisableSong}
        confirm="确认停止"
      >
        <div className="text-sm">
          <p>
            歌曲：<strong>{song.name}</strong>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            将停止收录 {activeVideos.length} 个视频
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            从 collected 移除并标记为不收录，历史数据保留
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
        <div className="text-sm">
          <p>
            歌曲：<strong>{song.name}</strong>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            将删除 {(song.videos ?? []).length} 个视频
          </p>
          <p className="text-xs text-destructive mt-1 font-medium">
            数据库记录将被永久删除（包括快照、排名关联等），不可恢复
          </p>
        </div>
      </Confirm>
    </div>
  );
}
