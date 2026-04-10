// src/modules/editor/views/Add.tsx
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
import { useEditor } from "../ctx";
import { Section } from "../components/Section";
import { Field } from "../components/Field";
import { Input } from "../components/Input";
import { Btn } from "../components/Btn";

interface Props {
  preset?: Song;
}

type Mode = "existing" | "new";
interface SongRef {
  id: number;
  name: string;
  display_name?: string | null;
}

export function AddView({ preset }: Props) {
  const { openSong } = useEditor();
  const [bvid, setBvid] = useState("");
  const [preview, setPreview] = useState<api.BilibiliVideoInfo | null>(null);
  const [fetching, setFetching] = useState(false);
  const [mode, setMode] = useState<Mode>(preset ? "existing" : "new");
  const [sel, setSel] = useState<SongRef | null>(
    preset
      ? {
          id: preset.id,
          name: preset.name,
          display_name: preset.display_name,
        }
      : null,
  );
  const [sq, setSq] = useState("");
  const [sr, setSr] = useState<SongRef[]>([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [songType, setSongType] = useState("原创");
  const [vocInput, setVocInput] = useState("");
  const [proInput, setProInput] = useState("");
  const [synInput, setSynInput] = useState("");
  const [copyright, setCopyright] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const split = (s: string) =>
    s
      .split(/[、,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
  const sLabel = (s: SongRef) => s.display_name?.trim() || s.name;

  const fetchVideo = async () => {
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
      const d = err?.response?.data?.detail;
      toast.error(
        typeof d === "string" ? d : err?.message || "获取视频信息失败",
      );
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (mode !== "existing" || !sq.trim()) {
      setSr([]);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.search("song", sq.trim(), 1, 10);
        setSr(
          (res.data ?? res ?? []).map((s: any) => ({
            id: s.id,
            name: s.name,
            display_name: s.display_name,
          })),
        );
      } catch {
        setSr([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [sq, mode]);

  const handleSubmit = async () => {
    if (!preview) return;

    if (mode === "existing") {
      if (!sel) {
        toast.error("请选择目标歌曲");
        return;
      }
      setSubmitting(true);
      try {
        const res = await api.addVideoToSong({
          song_id: sel.id,
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
            songId: sel.id,
            songName: sel.name,
            bvid: res.bvid,
            videoTitle: preview.title,
            uploader: preview.owner?.name,
          },
        });
        toast.success(`视频 ${res.bvid} 已添加到「${sLabel(sel)}」`);
        openSong(sel.id);
      } catch (err: any) {
        const d = err?.response?.data?.detail;
        toast.error(
          typeof d === "string"
            ? d
            : Array.isArray(d)
              ? d.map((x: any) => x.msg ?? String(x)).join("；")
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
          vocalist_names: split(vocInput),
          producer_names: split(proInput),
          synthesizer_names: split(synInput),
        });
        logEdit({
          targetType: "song",
          targetId: String(res.song_id),
          action: "add_song",
          detail: {
            songId: res.song_id,
            songName: name.trim(),
            displayName: displayName.trim() || undefined,
            bvid: res.bvid,
            videoTitle: preview.title,
            type: songType,
          },
        });
        toast.success(`歌曲已创建（ID: ${res.song_id}）`);
        openSong(res.song_id);
      } catch (err: any) {
        const d = err?.response?.data?.detail;
        toast.error(
          typeof d === "string"
            ? d
            : Array.isArray(d)
              ? d.map((x: any) => x.msg ?? String(x)).join("；")
              : err?.message || "创建失败",
        );
      } finally {
        setSubmitting(false);
      }
    }
  };

  const pubStr = preview
    ? new Date(preview.pubdate * 1000).toLocaleString("zh-CN")
    : "";
  const canSubmit =
    !!preview && !submitting && (mode === "existing" ? !!sel : !!name.trim());

  return (
    <div className="space-y-5">
      <Section title="视频信息">
        <div className="space-y-4">
          <Field label="BV 号">
            <div className="flex gap-2">
              <Input
                placeholder="输入 BV 号"
                value={bvid}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBvid(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                  e.key === "Enter" && fetchVideo()
                }
              />
              <Btn
                variant="primary"
                onClick={fetchVideo}
                disabled={fetching || !bvid.trim()}
                loading={fetching}
              >
                获取
              </Btn>
            </div>
          </Field>

          {preview && (
            <div className="flex gap-3 rounded-xl bg-muted/30 border border-border/30 p-3">
              {preview.pic && (
                <img
                  src={preview.pic}
                  alt=""
                  className="h-16 w-24 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium leading-snug truncate">
                  {preview.title}
                </p>
                <p className="text-[11px] text-muted-foreground/60">
                  {preview.bvid} · av{preview.aid} · {pubStr}
                </p>
                <p className="text-[11px] text-muted-foreground/60">
                  UP主：{preview.owner?.name} · 播放：
                  {preview.stat?.view?.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </Section>

      {preview && (
        <>
          <div className="flex gap-3">
            {(["existing", "new"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all",
                  mode === m
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/15"
                    : "border-border/50 text-muted-foreground hover:bg-muted/30",
                )}
              >
                {m === "existing" ? "添加到已有歌曲" : "创建新歌曲"}
              </button>
            ))}
          </div>

          {mode === "existing" ? (
            <Section title="目标歌曲">
              <div className="space-y-3">
                {sel && (
                  <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {sLabel(sel)}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60">
                        #{sel.id}
                        {sel.display_name &&
                          sel.display_name !== sel.name &&
                          ` · ${sel.name}`}
                      </p>
                    </div>
                    {!preset && (
                      <button
                        onClick={() => setSel(null)}
                        className="ml-2 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {!sel && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                      <Input
                        className="pl-9"
                        placeholder="搜索歌曲名称…"
                        value={sq}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setSq(e.target.value)
                        }
                      />
                      {searching && (
                        <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground/40" />
                      )}
                    </div>
                    {sr.length > 0 && (
                      <div className="max-h-48 overflow-y-auto rounded-xl border divide-y">
                        {sr.map((s) => (
                          <button
                            key={s.id}
                            className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-muted/40 transition-colors"
                            onClick={() => {
                              setSel(s);
                              setSq("");
                              setSr([]);
                            }}
                          >
                            <span className="truncate">{sLabel(s)}</span>
                            <span className="ml-2 shrink-0 text-xs text-muted-foreground/50">
                              #{s.id}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Section>
          ) : (
            <Section title="新歌曲信息">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="歌曲名称 *" error={!name.trim()}>
                    <Input
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setName(e.target.value)
                      }
                      placeholder="数据库唯一标识"
                    />
                  </Field>
                  <Field label="显示名称">
                    <Input
                      value={displayName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setDisplayName(e.target.value)
                      }
                      placeholder="留空则与歌曲名称相同"
                    />
                  </Field>
                </div>
                <Field label="歌曲类型">
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
                </Field>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Field label="歌手">
                    <TagEditor
                      value={vocInput}
                      onChange={setVocInput}
                      onInputChange={() => {}}
                      searchType="vocalist"
                    />
                  </Field>
                  <Field label="作者">
                    <TagEditor
                      value={proInput}
                      onChange={setProInput}
                      onInputChange={() => {}}
                      searchType="producer"
                    />
                  </Field>
                  <Field label="引擎">
                    <TagEditor
                      value={synInput}
                      onChange={setSynInput}
                      onInputChange={() => {}}
                      searchType="synthesizer"
                    />
                  </Field>
                </div>
              </div>
            </Section>
          )}

          <Section>
            <div className="space-y-4">
              <Field label="视频类型">
                <Select
                  value={String(copyright)}
                  onValueChange={(v: string) => setCopyright(Number(v))}
                >
                  <SelectTrigger className="h-9 sm:w-auto sm:min-w-52">
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
              </Field>
              <Btn
                variant="primary"
                className="w-full h-10"
                onClick={handleSubmit}
                disabled={!canSubmit}
                loading={submitting}
              >
                {submitting
                  ? "提交中…"
                  : mode === "existing"
                    ? "确认添加视频"
                    : "确认创建歌曲"}
              </Btn>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
