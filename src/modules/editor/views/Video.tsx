// src/modules/editor/views/Video.tsx
import { useState, useEffect, useCallback } from "react";
import { ExternalLink, ArrowRightLeft, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import { COPYRIGHT, COPYRIGHT_MAP } from "@/core/types/constants";
import { useEditor } from "../ctx";
import { useVideoForm } from "../hooks/useVideoForm";
import { Section } from "../components/Section";
import { Field } from "../components/Field";
import { Input } from "../components/Input";
import { Btn } from "../components/Btn";
import { SongCard } from "../components/SongCard";
import { Confirm } from "../components/Confirm";
import type { Song, Video } from "@/core/types/catalog";

function VideoHeader({ video }: { video: Video }) {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-black tracking-tight wrap-break-word">
        {video.title}
      </h2>
      <div className="flex items-center gap-x-2 gap-y-1 flex-wrap text-xs text-muted-foreground">
        <code className="select-all bg-muted/50 px-1.5 py-0.5 rounded text-[11px] font-mono">
          {video.bvid}
        </code>
        <span>{COPYRIGHT_MAP[video.copyright] ?? "未知"}</span>
        {video.uploader?.name && <span>· {video.uploader.name}</span>}
        {video.disabled && (
          <span className="text-orange-600 font-semibold">已停止收录</span>
        )}
        <a
          href={`https://www.bilibili.com/video/${video.bvid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-blue-500 hover:underline"
        >
          <ExternalLink className="h-3 w-3" /> B站
        </a>
      </div>
    </div>
  );
}

function VideoFormSection({
  video,
  parent,
  onSaved,
}: {
  video: Video;
  parent: Song | null;
  onSaved: () => void;
}) {
  const form = useVideoForm(
    video,
    parent ? { id: parent.id, name: parent.name } : null,
  );
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
      <Section title="视频信息">
        <div className="space-y-4">
          <Field label="视频标题" hint="标题会被下次爬虫覆盖">
            <Input
              value={form.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                form.setTitle(e.target.value)
              }
            />
          </Field>
          <Field label="版权类型">
            <Select
              value={String(form.copyright)}
              onValueChange={(v: string) => form.setCopyright(parseInt(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COPYRIGHT.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
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
        title="确认更新视频信息"
        loading={form.saving}
        onConfirm={doSave}
        confirm="确认更新"
      >
        <div className="text-sm space-y-2">
          <p>
            <code className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-xs">
              {video.bvid}
            </code>
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

export function VideoView({ video }: { video: Video }) {
  const { push, openSong, replace } = useEditor();
  const [parent, setParent] = useState<Song | null>(null);
  const [rmOpen, setRmOpen] = useState(false);
  const [rmLoading, setRmLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  useEffect(() => {
    if (!video.song_id) {
      setParent(null);
      return;
    }
    let c = false;
    api
      .selectSong(video.song_id, true)
      .then((r) => {
        if (!c) setParent(r.data);
      })
      .catch(() => {
        if (!c) setParent(null);
      });
    return () => {
      c = true;
    };
  }, [video.song_id]);

  const refresh = useCallback(async () => {
    try {
      const r = await api.selectVideo(video.bvid);
      replace({ id: "video", video: r.data });
    } catch {
      /* silent */
    }
  }, [video.bvid, replace]);

  const doRemove = async () => {
    setRmLoading(true);
    try {
      await api.deleteVideo(video.bvid);
      await logEdit({
        targetType: "video",
        targetId: video.bvid,
        action: "delete_video",
        detail: {
          bvid: video.bvid,
          title: video.title,
          songId: parent?.id ?? video.song_id ?? null,
          songName: parent?.name ?? null,
        },
      });
      toast.success(`已停止收录：${video.bvid}`);
      setRmOpen(false);
      refresh();
    } catch {
      toast.error("操作失败");
    } finally {
      setRmLoading(false);
    }
  };
  const doRestore = async () => {
    setRestoreLoading(true);
    try {
      const res = await api.restoreVideo(video.bvid);

      await logEdit({
        targetType: "video",
        targetId: video.bvid,
        action: "restore_video",
        detail: {
          bvid: video.bvid,
          title: video.title,
          songId: parent?.id ?? video.song_id ?? null,
          songName: parent?.name ?? null,
          collectedRow: res.collected_row ?? null,
        },
      });
      toast.success(`已恢复收录：${video.bvid}`);
      refresh();
    } catch {
      toast.error("操作失败");
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <VideoHeader video={video} />

      {video.disabled && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-xl px-4 py-3 text-sm">
          该视频已停止收录，数据不再更新
        </div>
      )}

      {parent && <SongCard song={parent} onClick={() => openSong(parent.id)} />}

      <VideoFormSection video={video} parent={parent} onSaved={refresh} />

      <div className="flex flex-wrap gap-2 pt-1">
        <Btn
          icon={<ArrowRightLeft className="h-3.5 w-3.5" />}
          onClick={() =>
            push({
              id: "reassign",
              bvid: video.bvid,
              title: video.title,
              parent,
            })
          }
        >
          拆分/移动
        </Btn>
        {video.disabled ? (
          <Btn
            variant="primary"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            loading={restoreLoading}
            onClick={doRestore}
          >
            恢复收录
          </Btn>
        ) : (
          <Btn
            variant="danger"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => setRmOpen(true)}
          >
            停止收录
          </Btn>
        )}
      </div>

      <Confirm
        open={rmOpen}
        onOpenChange={setRmOpen}
        title="确认停止收录"
        variant="destructive"
        loading={rmLoading}
        onConfirm={doRemove}
        confirm="确认停止"
      >
        <div className="text-sm space-y-2">
          <p>
            <code className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-xs">
              {video.bvid}
            </code>
          </p>
          {video.title && (
            <p className="text-xs text-muted-foreground wrap-break-word">
              {video.title}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            将从 collected 移除并标记为不收录，历史数据保留
          </p>
        </div>
      </Confirm>
    </div>
  );
}
