// src/modules/editor/video/AddVideoPanel.tsx

import { useState } from "react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import type { Song } from "@/core/types/catalog";

interface Props {
  song: Song;
  onDone: () => void;
}

export function AddVideoPanel({ song, onDone }: Props) {
  const [bvid, setBvid] = useState("");
  const [preview, setPreview] = useState<api.BilibiliVideoInfo | null>(null);
  const [copyright, setCopyright] = useState(1);
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFetch = async () => {
    const id = bvid.trim();
    if (!id) return;
    setFetching(true);
    setPreview(null);
    try {
      const info = await api.fetchBilibiliVideo(id);
      setPreview(info);
      setCopyright(info.copyright);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: any) => d.msg ?? String(d)).join("；")
            : err?.message || "获取视频信息失败";
      toast.error(msg);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!preview) return;
    setSubmitting(true);
    try {
      const res = await api.addVideoToSong({
        song_id: song.id,
        bvid: preview.bvid,
        title: preview.title,
        aid: preview.aid,
        pubdate_ts: preview.pubdate,
        copyright,
        thumbnail: preview.pic,
        uploader_name: preview.owner?.name,
        duration: preview.duration,
        view: preview.stat?.view || 0,
      });

      logEdit({
        targetType: "video",
        targetId: res.bvid,
        action: "add_video",
        detail: {
          songId: song.id,
          songName: song.display_name?.trim() || song.name,
          bvid: res.bvid,
          collectedRow: res.collected_row,
        },
      });

      toast.success(
        `视频 ${res.bvid} 已添加到「${song.display_name?.trim() || song.name}」`,
      );
      onDone();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: any) => d.msg ?? String(d)).join("；")
            : err?.message || "添加失败";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const pubdateStr = preview
    ? new Date(preview.pubdate * 1000).toLocaleString("zh-CN")
    : "";

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold">
        为「{song.display_name?.trim() || song.name}」添加视频
      </h3>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
          placeholder="输入 BV 号，如 BV1xx411x7xx"
          value={bvid}
          onChange={(e) => setBvid(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFetch()}
        />
        <button
          className="shrink-0 rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
          onClick={handleFetch}
          disabled={fetching || !bvid.trim()}
        >
          {fetching ? "获取中…" : "获取信息"}
        </button>
      </div>

      {preview && (
        <div className="space-y-3 rounded-md border bg-muted/30 p-3">
          <div className="flex gap-3">
            {preview.pic && (
              <img
                src={preview.pic}
                alt=""
                className="h-16 w-24 shrink-0 rounded object-cover"
              />
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium leading-snug">
                {preview.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {preview.bvid} · av{preview.aid} · {pubdateStr}
              </p>
              <p className="text-xs text-muted-foreground">
                UP主：{preview.owner?.name} · 播放：
                {preview.stat?.view?.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">版权类型：</label>
            <select
              className="rounded border bg-background px-2 py-1 text-xs"
              value={copyright}
              onChange={(e) => setCopyright(Number(e.target.value))}
            >
              <option value={1}>1 - 自制</option>
              <option value={2}>2 - 转载</option>
            </select>
          </div>

          <button
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "添加中…" : "确认添加"}
          </button>
        </div>
      )}
    </div>
  );
}
