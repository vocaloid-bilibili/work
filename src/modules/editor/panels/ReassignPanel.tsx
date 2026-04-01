// src/modules/editor/panels/ReassignPanel.tsx
import { useState, useEffect } from "react";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { Card, CardContent } from "@/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import EntityPicker from "@/shared/ui/EntityPicker";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import SongInfoCard from "../shared/SongInfoCard";
import NewSongForm from "./NewSongForm";
import type { Song, SongType } from "@/core/types/catalog";

function tags(s: string) {
  return s
    .split("、")
    .map((t) => t.trim())
    .filter(Boolean);
}

interface Props {
  bvid: string;
  videoTitle: string;
  parentSong: Song | null;
  onDone: () => void;
  onCancel: () => void;
}

export default function ReassignPanel({
  bvid,
  videoTitle,
  parentSong,
  onDone,
  onCancel,
}: Props) {
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
    if (!parentSong) return;
    setType(parentSong.type as SongType);
    setVoc((parentSong.vocalists ?? []).map((a) => a.name).join("、"));
    setPro((parentSong.producers ?? []).map((a) => a.name).join("、"));
    setSyn((parentSong.synthesizers ?? []).map((a) => a.name).join("、"));
  }, [parentSong]);

  const canSubmit =
    (mode === "existing" && target && target.id !== parentSong?.id) ||
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
          title: videoTitle,
          fromSong: { id: parentSong?.id, name: parentSong?.name },
          ...(mode === "existing"
            ? { toSong: { id: target!.id, name: target!.name } }
            : { newSongName: name.trim() }),
        },
      });
      toast.success("视频移动成功");
      setConfirmOpen(false);
      onDone();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "移动失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="pt-4">
          <div className="text-sm font-medium truncate">{videoTitle}</div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">
            {bvid}
          </div>
          {parentSong && (
            <div className="mt-3">
              <div className="text-[10px] text-muted-foreground mb-1">
                当前所属歌曲
              </div>
              <SongInfoCard song={parentSong} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-2">
            <Label>移动到</Label>
            <Select
              value={mode}
              onValueChange={(v: "existing" | "new") => {
                setMode(v);
                setTarget(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="existing">已有歌曲</SelectItem>
                <SelectItem value="new">创建新歌曲</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === "existing" && (
            <div className="space-y-2">
              <Label>目标歌曲</Label>
              <EntityPicker
                kind="song"
                value={target}
                onChange={setTarget}
                placeholder="搜索目标歌曲"
              />
            </div>
          )}
          {mode === "new" && (
            <NewSongForm
              name={name}
              onNameChange={setName}
              type={type}
              onTypeChange={setType}
              vocalists={voc}
              onVocalistsChange={setVoc}
              producers={pro}
              onProducersChange={setPro}
              synthesizers={syn}
              onSynthesizersChange={setSyn}
              showInheritHint={!!parentSong}
            />
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              取消
            </Button>
            <Button
              className="flex-1"
              disabled={!canSubmit}
              onClick={() => setConfirmOpen(true)}
            >
              移动视频
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="确认移动视频"
        loading={submitting}
        onConfirm={confirm}
        confirm="确认移动"
      >
        <div className="space-y-2 text-sm">
          <p>
            视频: <strong className="font-mono">{bvid}</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            从: {parentSong?.name ?? `ID ${parentSong?.id}`}
          </p>
          <p className="text-xs text-muted-foreground">
            到: {mode === "existing" ? target?.name : `新歌曲「${name}」`}
          </p>
        </div>
      </ConfirmDialog>
    </div>
  );
}
