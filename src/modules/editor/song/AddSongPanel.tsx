// src/modules/editor/song/AddSongPanel.tsx

import { useState } from "react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";

interface Props {
  onDone: (songId: number) => void;
  onCancel: () => void;
}

export function AddSongPanel({ onDone, onCancel }: Props) {
  const [bvid, setBvid] = useState("");
  const [preview, setPreview] = useState<api.BilibiliVideoInfo | null>(null);
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [songType, setSongType] = useState("原创");
  const [copyright, setCopyright] = useState(1);
  const [producerInput, setProducerInput] = useState("");
  const [vocalistInput, setVocalistInput] = useState("");
  const [synthesizerInput, setSynthesizerInput] = useState("");

  const handleFetch = async () => {
    const id = bvid.trim();
    if (!id) return;
    setFetching(true);
    setPreview(null);
    try {
      const info = await api.fetchBilibiliVideo(id);
      setPreview(info);
      setCopyright(info.copyright);
      if (!name) setName(info.title);
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

  const splitNames = (input: string) =>
    input
      .split(/[、,，]/)
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSubmit = async () => {
    if (!preview || !name.trim()) {
      toast.error("请填写歌曲名称并获取视频信息");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.addNewSong({
        bvid: preview.bvid,
        name: name.trim(),
        display_name: displayName.trim() || undefined,
        type: songType,
        title: preview.title,
        aid: preview.aid,
        pubdate_ts: preview.pubdate,
        copyright,
        thumbnail: preview.pic,
        uploader_name: preview.owner?.name,
        duration: preview.duration,
        view: preview.stat?.view || 0,
        vocalist_names: splitNames(vocalistInput),
        producer_names: splitNames(producerInput),
        synthesizer_names: splitNames(synthesizerInput),
      });

      logEdit({
        targetType: "song",
        targetId: String(res.song_id),
        action: "add_song",
        detail: {
          songId: res.song_id,
          songName: displayName.trim() || name.trim(),
          bvid: res.bvid,
          collectedRow: res.collected_row,
        },
      });

      toast.success(`歌曲已创建 (ID: ${res.song_id})`);
      onDone(res.song_id);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: any) => d.msg ?? String(d)).join("；")
            : err?.message || "创建失败";
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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">创建新歌曲</h3>
        <button
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={onCancel}
        >
          取消
        </button>
      </div>

      {/* bvid 输入 */}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
          placeholder="输入 BV 号"
          value={bvid}
          onChange={(e) => setBvid(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFetch()}
        />
        <button
          className="shrink-0 rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
          onClick={handleFetch}
          disabled={fetching || !bvid.trim()}
        >
          {fetching ? "获取中…" : "获取"}
        </button>
      </div>

      {/* 视频预览 */}
      {preview && (
        <div className="flex gap-3 rounded-md border bg-muted/30 p-3">
          {preview.pic && (
            <img
              src={preview.pic}
              alt=""
              className="h-14 w-20 shrink-0 rounded object-cover"
            />
          )}
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium leading-snug">{preview.title}</p>
            <p className="text-xs text-muted-foreground">
              {preview.bvid} · {pubdateStr} · UP: {preview.owner?.name} · 播放:{" "}
              {preview.stat?.view?.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* 歌曲信息 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            歌曲名称（唯一标识）*
          </label>
          <input
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="数据库中的 name"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            显示名称
          </label>
          <input
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="留空则与歌曲名称相同"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            类型
          </label>
          <select
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            value={songType}
            onChange={(e) => setSongType(e.target.value)}
          >
            <option value="原创">原创</option>
            <option value="翻唱">翻唱</option>
            <option value="本家重置">本家重置</option>
            <option value="串烧">串烧</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            版权类型
          </label>
          <select
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            value={copyright}
            onChange={(e) => setCopyright(Number(e.target.value))}
          >
            <option value={1}>1 - 自制</option>
            <option value={2}>2 - 转载</option>
          </select>
        </div>
      </div>

      {/* 艺人 */}
      <div className="space-y-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            P主（用「、」或「,」分隔）
          </label>
          <input
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            value={producerInput}
            onChange={(e) => setProducerInput(e.target.value)}
            placeholder="如: wowaka、ハチ"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            歌手 / Vocal
          </label>
          <input
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            value={vocalistInput}
            onChange={(e) => setVocalistInput(e.target.value)}
            placeholder="如: 初音ミク、巡音ルカ"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            合成器 / Synthesizer
          </label>
          <input
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            value={synthesizerInput}
            onChange={(e) => setSynthesizerInput(e.target.value)}
            placeholder="如: VOCALOID、SynthV"
          />
        </div>
      </div>

      <button
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        onClick={handleSubmit}
        disabled={submitting || !preview || !name.trim()}
      >
        {submitting ? "创建中…" : "创建歌曲"}
      </button>
    </div>
  );
}
