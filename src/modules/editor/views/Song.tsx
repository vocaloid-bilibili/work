// src/modules/editor/views/Song.tsx
import { useState, useCallback } from "react";
import {
  ExternalLink,
  GitMerge,
  Plus,
  Trash2,
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

  return (
    <div className="space-y-1.5">
      <h2 className="text-xl font-black tracking-tight truncate">{name}</h2>
      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
        {song.display_name && <span>{song.name}</span>}
        <span>#{song.id}</span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground/60">
          {song.type}
        </span>
        <span>{videos.length} 视频</span>
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

  if (videos.length === 0) return null;

  const doRemove = async () => {
    if (!rmBvid) return;
    setRmLoading(true);
    try {
      await logEdit({
        targetType: "video",
        targetId: rmBvid,
        action: "delete_video",
        detail: { bvid: rmBvid, title: rmTitle },
      });
      toast.success(`已提交移除：${rmBvid}`);
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
        title={`关联视频（${videos.length}）`}
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
            {videos.map((v) => (
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
          </div>
        )}
      </Section>

      <Confirm
        open={!!rmBvid}
        onOpenChange={(v) => {
          if (!v) setRmBvid(null);
        }}
        title="确认移除视频"
        variant="destructive"
        loading={rmLoading}
        onConfirm={doRemove}
        confirm="确认移除"
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
            仅从 collected 数据移除，数据库不受影响
          </p>
        </div>
      </Confirm>
    </>
  );
}

export function SongView({ song }: { song: Song }) {
  const { home, push, replace } = useEditor();
  const rels = useRelations(song);
  const [rmSongOpen, setRmSongOpen] = useState(false);
  const [rmSongLoading, setRmSongLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await api.selectSong(song.id);
      replace({ id: "song", song: r.data });
    } catch {
      /* silent */
    }
  }, [song.id, replace]);

  const doRemoveSong = async () => {
    setRmSongLoading(true);
    try {
      const bvids = song.videos?.map((v) => v.bvid) ?? [];
      await logEdit({
        targetType: "song",
        targetId: String(song.id),
        action: "delete_song",
        detail: { songName: song.name, bvids },
      });
      toast.success(`已提交移除：${song.name}（${bvids.length} 个视频）`);
      setRmSongOpen(false);
      home();
    } catch {
      toast.error("操作失败");
    } finally {
      setRmSongLoading(false);
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
        <Btn
          variant="danger"
          icon={<Trash2 className="h-3.5 w-3.5" />}
          onClick={() => setRmSongOpen(true)}
        >
          从收录移除
        </Btn>
      </div>

      <Confirm
        open={rmSongOpen}
        onOpenChange={setRmSongOpen}
        title="确认移除歌曲"
        variant="destructive"
        loading={rmSongLoading}
        onConfirm={doRemoveSong}
        confirm="确认移除"
      >
        <div className="text-sm">
          <p>
            歌曲：<strong>{song.name}</strong>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            将移除 {song.videos?.length ?? 0} 个视频的收录行
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            仅从 collected 数据移除，数据库不受影响
          </p>
        </div>
      </Confirm>
    </div>
  );
}
