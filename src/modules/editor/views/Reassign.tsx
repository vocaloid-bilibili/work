// src/modules/editor/views/Reassign.tsx
import { useState, useEffect } from "react";
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
import { useEditor } from "../ctx";
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

interface Props {
  bvid: string;
  title: string;
  parent: Song | null;
}

export function ReassignView({ bvid, title, parent }: Props) {
  const { back } = useEditor();
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [target, setTarget] = useState<{ id: number; name: string } | null>(
    null,
  );
  const [name, setName] = useState("");
  const [type, setType] = useState<SongType>("原创");
  const [voc, setVoc] = useState("");
  const [pro, setPro] = useState("");
  const [syn, setSyn] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!parent) return;
    setType(parent.type as SongType);
    setVoc((parent.vocalists ?? []).map((a) => a.name).join("、"));
    setPro((parent.producers ?? []).map((a) => a.name).join("、"));
    setSyn((parent.synthesizers ?? []).map((a) => a.name).join("、"));
  }, [parent]);

  const canSubmit =
    (mode === "existing" && target && target.id !== parent?.id) ||
    (mode === "new" && name.trim());

  const confirm = async () => {
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
            vocalist_ids: v.data.map((a) => a.id),
            producer_ids: p.data.map((a) => a.id),
            synthesizer_ids: s.data.map((a) => a.id),
          });
        } catch {
          toast.warning("视频已移动，但新歌曲属性设置失败");
        }
      }
      logEdit({
        targetType: "video",
        targetId: bvid,
        action: "reassign_video",
        detail: {
          bvid,
          title,
          fromSong: parent ? { id: parent.id, name: parent.name } : null,
          ...(mode === "existing"
            ? { toSong: { id: target!.id, name: target!.name } }
            : { newSongName: name.trim() }),
        },
      });
      toast.success("视频移动成功");
      setConfirmOpen(false);
      back();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "移动失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <Section title="当前视频">
        <div>
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-muted-foreground/60 font-mono mt-0.5">
            {bvid}
          </p>
          {parent && (
            <div className="mt-3">
              <SongCard song={parent} compact />
            </div>
          )}
        </div>
      </Section>

      <Section title="移动到">
        <div className="space-y-4">
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
                <Select
                  value={type}
                  onValueChange={(v: SongType) => setType(v)}
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
              {parent && (
                <p className="text-[10px] text-muted-foreground/60">
                  以下艺人从原歌曲继承，可修改
                </p>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <Field label="歌手">
                  <TagEditor
                    value={voc}
                    onChange={setVoc}
                    onInputChange={() => {}}
                    searchType="vocalist"
                  />
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
            <Btn className="flex-1" onClick={back}>
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
      </Section>

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
            视频：<strong className="font-mono">{bvid}</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            从：{parent?.name ?? "?"}
          </p>
          <p className="text-xs text-muted-foreground">
            到：{mode === "existing" ? target?.name : `新歌曲「${name}」`}
          </p>
        </div>
      </Confirm>
    </div>
  );
}
