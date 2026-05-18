// src/modules/editor/pages/ReassignPage.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { SONG_TYPES } from "@/core/types/constants";
import EntityPicker from "@/shared/ui/EntityPicker";
import TagEditor from "@/shared/ui/TagEditor";
import { cn } from "@/ui/cn";
import { Section } from "../components/Section";
import { SongCard } from "../components/SongCard";
import { Field } from "../components/Field";
import { Input } from "../components/Input";
import { Btn } from "../components/Btn";
import { Confirm } from "../components/Confirm";
import type { Song, SongType } from "@/core/types/catalog";

function tags(s: string) {
  return s
    .split("、")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function ReassignPage() {
  const { bvid } = useParams<{ bvid: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [parent, setParent] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [target, setTarget] = useState<{ id: number; name: string } | null>(
    null,
  );
  const [name, setName] = useState("");
  const [type, setType] = useState<SongType>("原创");
  const [voc, setVoc] = useState("");
  const [pro, setPro] = useState("");
  const [syn, setSyn] = useState("");
  const [vocalSupport, setVocalSupport] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!bvid) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    api
      .selectVideo(bvid)
      .then(async (r) => {
        const video = r.data;
        setTitle(video.title);
        if (video.song_id) {
          try {
            const songRes = await api.selectSong(video.song_id, true);
            setParent(songRes.data);
          } catch {
            setParent(null);
          }
        } else {
          setParent(null);
        }
      })
      .catch((e: unknown) => {
        const axErr = e as { response?: { data?: { detail?: string } } };
        toast.error(axErr?.response?.data?.detail || "加载视频失败");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [bvid]);

  useEffect(() => {
    if (!parent) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setType(parent.type as SongType);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVoc((parent.vocalists ?? []).map((a) => a.name).join("、"));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPro((parent.producers ?? []).map((a) => a.name).join("、"));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSyn((parent.synthesizers ?? []).map((a) => a.name).join("、"));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVocalSupport(
      new Set(
        (parent.vocalists ?? []).filter((a) => a.is_support).map((a) => a.name),
      ),
    );
  }, [parent]);

  const vocalNames = useMemo(() => tags(voc), [voc]);

  const handleVocChange = useCallback((v: string) => {
    setVoc(v);
    const names = tags(v);
    setVocalSupport((prev) => {
      const cleaned = new Set([...prev].filter((n) => names.includes(n)));
      return cleaned.size !== prev.size ? cleaned : prev;
    });
  }, []);

  const toggleVocalSupport = useCallback(
    (n: string) => {
      setVocalSupport((prev) => {
        const next = new Set(prev);
        if (next.has(n)) next.delete(n);
        else next.add(n);
        return new Set([...next].filter((x) => vocalNames.includes(x)));
      });
    },
    [vocalNames],
  );

  if (loading) return <div>加载中...</div>;
  if (!bvid) return <div>视频不存在</div>;

  const canSubmit =
    (mode === "existing" && target && target.id !== parent?.id) ||
    (mode === "new" && name.trim());

  const confirm = async () => {
    if (!bvid) return;
    setSubmitting(true);
    try {
      const r = await api.reassignVideo(
        bvid,
        mode === "existing" ? target?.id : undefined,
        mode === "new" ? name.trim() : undefined,
      );
      if (mode === "new" && r.new_song_id) {
        try {
          const [v, p, s] = await Promise.all([
            tags(voc).length
              ? api.resolveArtists("vocalist", tags(voc))
              : { data: [] },
            tags(pro).length
              ? api.resolveArtists("producer", tags(pro))
              : { data: [] },
            tags(syn).length
              ? api.resolveArtists("synthesizer", tags(syn))
              : { data: [] },
          ]);
          await api.editSong({
            id: r.new_song_id,
            type,
            vocalists: v.data.map((a) => ({
              id: a.id,
              is_support: vocalSupport.has(a.name),
            })),
            producer_ids: p.data.map((a) => a.id),
            synthesizer_ids: s.data.map((a) => a.id),
          });
        } catch {
          toast.warning("视频已移动，但新歌曲属性设置失败");
        }
      }
      await logEdit({
        targetType: "video",
        targetId: bvid,
        action: "reassign_video",
        detail: {
          bvid,
          title,
          fromSong: parent ? { id: parent.id, name: parent.name } : null,
          ...(mode === "existing"
            ? { toSong: { id: target!.id, name: target!.name } }
            : {
                toSong: { id: r.new_song_id, name: name.trim() },
                newSongName: name.trim(),
              }),
          collectedUpdate: r.collected_update,
        },
      });
      toast.success("视频移动成功");
      setConfirmOpen(false);
      navigate(-1);
    } catch (e: unknown) {
      const axErr = e as { response?: { data?: { detail?: string } } };
      toast.error(axErr?.response?.data?.detail || "移动失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <Section title="当前视频">
        <div>
          <p className="text-sm font-medium wrap-break-word">{title}</p>
          <code className="text-xs text-muted-foreground/60 font-mono mt-0.5 block">
            {bvid}
          </code>
          {parent && (
            <div className="mt-3">
              <SongCard song={parent} compact />
            </div>
          )}
        </div>
      </Section>
      <div className="space-y-4">
        <h3 className="text-sm font-bold px-1">移动到</h3>
        <Field label="目标">
          <Select
            value={mode}
            onValueChange={(v: "existing" | "new") => {
              setMode(v);
              setTarget(null);
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="existing">已有歌曲</SelectItem>
              <SelectItem value="new">创建新歌曲</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {mode === "existing" && (
          <EntityPicker
            kind="song"
            value={target}
            onChange={setTarget}
            placeholder="搜索目标歌曲"
          />
        )}
        {mode === "new" && (
          <div className="space-y-3 rounded-xl border p-4">
            <p className="text-sm font-medium">新歌曲信息</p>
            <Field label="歌曲名称">
              <Input
                placeholder="输入新歌曲名称"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
              />
            </Field>
            <Field label="类型">
              <Select value={type} onValueChange={(v: SongType) => setType(v)}>
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
            {parent && (
              <p className="text-[10px] text-muted-foreground/60">
                以下艺人从原歌曲继承，可修改
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="歌手">
                <TagEditor
                  value={voc}
                  onChange={handleVocChange}
                  onInputChange={() => {}}
                  searchType="vocalist"
                />
                {vocalNames.length >= 2 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {vocalNames.map((vn) => {
                      const isSupport = vocalSupport.has(vn);
                      return (
                        <button
                          key={vn}
                          type="button"
                          onClick={() => toggleVocalSupport(vn)}
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[11px] transition-colors border cursor-pointer select-none",
                            isSupport
                              ? "border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300"
                              : "border-transparent text-muted-foreground hover:text-foreground/70",
                          )}
                        >
                          {vn}
                          {isSupport && (
                            <span className="ml-0.5 text-[10px]">和声</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Field>
              <Field label="作者">
                <TagEditor
                  value={pro}
                  onChange={setPro}
                  onInputChange={() => {}}
                  searchType="producer"
                />
              </Field>
              <Field label="引擎">
                <TagEditor
                  value={syn}
                  onChange={setSyn}
                  onInputChange={() => {}}
                  searchType="synthesizer"
                />
              </Field>
            </div>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <Btn className="flex-1" onClick={() => navigate(-1)}>
            取消
          </Btn>
          <Btn
            variant="primary"
            className="flex-1"
            disabled={!canSubmit}
            onClick={() => setConfirmOpen(true)}
          >
            移动视频
          </Btn>
        </div>
      </div>
      <Confirm
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="确认移动视频"
        loading={submitting}
        onConfirm={confirm}
        confirm="确认移动"
      >
        <div className="space-y-1.5 text-sm">
          <p>
            视频：
            <code className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-xs">
              {bvid}
            </code>
          </p>
          <p className="text-xs text-muted-foreground wrap-break-word">
            从：{parent?.name ?? "?"}
          </p>
          <p className="text-xs text-muted-foreground wrap-break-word">
            到：{mode === "existing" ? target?.name : `新歌曲「${name}」`}
          </p>
        </div>
      </Confirm>
    </div>
  );
}
