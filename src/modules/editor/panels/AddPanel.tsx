// src/modules/editor/panels/AddPanel.tsx

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Search, X, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import TagEditor from "@/shared/ui/TagEditor";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import { COPYRIGHT, SONG_TYPES } from "@/core/types/constants";
import type { Song } from "@/core/types/catalog";
import { cn } from "@/ui/cn";

interface Props {
  presetSong?: Song;
  onDone: (songId: number) => void;
  onCancel: () => void;
}

type Mode = "existing" | "new";

interface SongSearchResult {
  id: number;
  name: string;
  display_name?: string | null;
}

export default function AddPanel({ presetSong, onDone, onCancel }: Props) {
  // ── bvid & preview ──
  const [bvid, setBvid] = useState("");
  const [preview, setPreview] = useState<api.BilibiliVideoInfo | null>(null);
  const [fetching, setFetching] = useState(false);

  // ── mode ──
  const [mode, setMode] = useState<Mode>(presetSong ? "existing" : "new");

  // ── existing song ──
  const [selectedSong, setSelectedSong] = useState<SongSearchResult | null>(
    presetSong
      ? {
          id: presetSong.id,
          name: presetSong.name,
          display_name: presetSong.display_name,
        }
      : null,
  );
  const [songQuery, setSongQuery] = useState("");
  const [songResults, setSongResults] = useState<SongSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── new song ──
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [songType, setSongType] = useState("原创");
  const [producerInput, setProducerInput] = useState("");
  const [vocalistInput, setVocalistInput] = useState("");
  const [synthesizerInput, setSynthesizerInput] = useState("");

  // ── shared ──
  const [copyright, setCopyright] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // ── fetch bilibili video ──
  const handleFetch = async () => {
    const id = bvid.trim();
    if (!id) return;
    setFetching(true);
    setPreview(null);
    try {
      const info = await api.fetchBilibiliVideo(id);
      setPreview(info);
      setCopyright(info.copyright);
      if (mode === "new" && !name) setName(info.title);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(
        typeof detail === "string"
          ? detail
          : err?.message || "获取视频信息失败",
      );
    } finally {
      setFetching(false);
    }
  };

  // ── song search (debounced) ──
  useEffect(() => {
    if (mode !== "existing" || !songQuery.trim()) {
      setSongResults([]);
      return;
    }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.search("song", songQuery.trim(), 1, 10);
        const items: SongSearchResult[] = (res.data ?? res ?? []).map(
          (s: any) => ({
            id: s.id,
            name: s.name,
            display_name: s.display_name,
          }),
        );
        setSongResults(items);
      } catch {
        setSongResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [songQuery, mode]);

  // ── helpers ──
  const splitNames = (input: string) =>
    input
      .split(/[、,，]/)
      .map((s) => s.trim())
      .filter(Boolean);

  const songDisplayName = (s: SongSearchResult) =>
    s.display_name?.trim() || s.name;

  // ── submit ──
  const handleSubmit = async () => {
    if (!preview) return;

    if (mode === "existing") {
      if (!selectedSong) {
        toast.error("请选择目标歌曲");
        return;
      }
      setSubmitting(true);
      try {
        const res = await api.addVideoToSong({
          song_id: selectedSong.id,
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
            songId: selectedSong.id,
            songName: songDisplayName(selectedSong),
            bvid: res.bvid,
            collectedRow: res.collected_row,
          },
        });

        toast.success(
          `视频 ${res.bvid} 已添加到「${songDisplayName(selectedSong)}」`,
        );
        onDone(selectedSong.id);
      } catch (err: any) {
        const detail = err?.response?.data?.detail;
        toast.error(
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((d: any) => d.msg ?? String(d)).join("；")
              : err?.message || "添加失败",
        );
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!name.trim()) {
        toast.error("请填写歌曲名称");
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
        toast.error(
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((d: any) => d.msg ?? String(d)).join("；")
              : err?.message || "创建失败",
        );
      } finally {
        setSubmitting(false);
      }
    }
  };

  const pubdateStr = preview
    ? new Date(preview.pubdate * 1000).toLocaleString("zh-CN")
    : "";

  const canSubmit =
    !!preview &&
    !submitting &&
    (mode === "existing" ? !!selectedSong : !!name.trim());

  return (
    <div className="space-y-5 rounded-lg border bg-card p-4 sm:p-5">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">添加收录</h3>
        <button
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={onCancel}
        >
          取消
        </button>
      </div>

      {/* ① BV 号输入 */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          BV 号
        </label>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="输入 BV 号"
            value={bvid}
            onChange={(e) => setBvid(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
          />
          <button
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            onClick={handleFetch}
            disabled={fetching || !bvid.trim()}
          >
            {fetching ? "获取中…" : "获取信息"}
          </button>
        </div>
      </div>

      {preview && (
        <div className="flex gap-3 rounded-lg border bg-muted/30 p-3">
          {preview.pic && (
            <img
              src={preview.pic}
              alt=""
              className="h-16 w-24 shrink-0 rounded-md object-cover"
            />
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium leading-snug">{preview.title}</p>
            <p className="text-xs text-muted-foreground">
              {preview.bvid} · av{preview.aid} · {pubdateStr}
            </p>
            <p className="text-xs text-muted-foreground">
              UP主：{preview.owner?.name} · 播放：
              {preview.stat?.view?.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {preview && (
        <>
          <div className="flex gap-3">
            {(["existing", "new"] as const).map((m) => (
              <label
                key={m}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition",
                  mode === m
                    ? "border-primary bg-primary/5 font-medium text-primary"
                    : "border-border text-muted-foreground hover:bg-muted/50",
                )}
              >
                <input
                  type="radio"
                  name="add-mode"
                  value={m}
                  checked={mode === m}
                  onChange={() => setMode(m)}
                  className="sr-only"
                />
                {m === "existing" ? "添加到已有歌曲" : "创建新歌曲"}
              </label>
            ))}
          </div>

          {mode === "existing" ? (
            <div className="space-y-3">
              {selectedSong && (
                <div className="flex items-center justify-between rounded-lg border bg-primary/5 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {songDisplayName(selectedSong)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {selectedSong.id}
                      {selectedSong.display_name &&
                        selectedSong.display_name !== selectedSong.name &&
                        ` · ${selectedSong.name}`}
                    </p>
                  </div>
                  {!presetSong && (
                    <button
                      className="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => setSelectedSong(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              {!selectedSong && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm"
                      placeholder="搜索歌曲名称…"
                      value={songQuery}
                      onChange={(e) => setSongQuery(e.target.value)}
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {songResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto rounded-md border divide-y">
                      {songResults.map((s) => (
                        <button
                          key={s.id}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/50"
                          onClick={() => {
                            setSelectedSong(s);
                            setSongQuery("");
                            setSongResults([]);
                          }}
                        >
                          <span className="truncate">{songDisplayName(s)}</span>
                          <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                            #{s.id}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col space-y-1">
                  <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                    歌曲名称 *
                  </span>
                  <input
                    className={cn(
                      "h-9 w-full rounded-md border bg-background px-3 text-sm",
                      !name.trim() &&
                        "border-destructive focus:ring-destructive",
                    )}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="数据库唯一标识"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                    显示名称
                  </span>
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="留空则与歌曲名称相同"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                  歌曲类型
                </span>
                <Select value={songType} onValueChange={setSongType}>
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
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-3">
                <div className="flex flex-col space-y-1">
                  <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                    歌手
                  </span>
                  <TagEditor
                    value={vocalistInput}
                    onChange={setVocalistInput}
                    onInputChange={() => {}}
                    searchType="vocalist"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                    作者
                  </span>
                  <TagEditor
                    value={producerInput}
                    onChange={setProducerInput}
                    onInputChange={() => {}}
                    searchType="producer"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                    引擎
                  </span>
                  <TagEditor
                    value={synthesizerInput}
                    onChange={setSynthesizerInput}
                    onInputChange={() => {}}
                    searchType="synthesizer"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
              视频类型
            </span>
            <Select
              value={String(copyright)}
              onValueChange={(v) => setCopyright(Number(v))}
            >
              <SelectTrigger className="h-9 sm:w-auto sm:min-w-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COPYRIGHT.map((c) => (
                  <SelectItem key={c.value} value={String(c.value)}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting
              ? "提交中…"
              : mode === "existing"
                ? "确认添加视频"
                : "确认创建歌曲"}
          </button>
        </>
      )}
    </div>
  );
}
