// src/modules/editor/dialogs/ReassignDialog.tsx
import { useState, useEffect } from "react";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
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
import ArtistFields from "../shared/ArtistFields";
import type { Song, SongType } from "@/core/types/catalog";

const SONG_TYPES: SongType[] = ["原创", "翻唱", "本家重置", "串烧"];

function parseTags(s: string): string[] {
  return s
    .split("、")
    .map((t) => t.trim())
    .filter(Boolean);
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bvid: string;
  videoTitle?: string;
  parentSong?: Song | null;
  onDone?: () => void;
}

export default function ReassignDialog({
  open,
  onOpenChange,
  bvid,
  videoTitle,
  parentSong,
  onDone,
}: Props) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [targetSong, setTargetSong] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<SongType>("原创");
  const [vocalists, setVocalists] = useState("");
  const [producers, setProducers] = useState("");
  const [synthesizers, setSynthesizers] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");

  // 继承原歌曲信息
  useEffect(() => {
    if (open && parentSong) {
      setNewType(parentSong.type as SongType);
      setVocalists((parentSong.vocalists ?? []).map((a) => a.name).join("、"));
      setProducers((parentSong.producers ?? []).map((a) => a.name).join("、"));
      setSynthesizers(
        (parentSong.synthesizers ?? []).map((a) => a.name).join("、"),
      );
    }
  }, [open, parentSong]);

  useEffect(() => {
    if (!open) {
      setStep("form");
      setTargetSong(null);
      setNewName("");
      setMode("existing");
    }
  }, [open]);

  const canSubmit =
    (mode === "existing" && targetSong && targetSong.id !== parentSong?.id) ||
    (mode === "new" && newName.trim());

  const confirm = async () => {
    try {
      setSubmitting(true);
      const result = await api.reassignVideo(
        bvid,
        mode === "existing" ? targetSong?.id : undefined,
        mode === "new" ? newName.trim() : undefined,
      );

      // 新歌曲：设置属性
      if (mode === "new" && result.new_song_id) {
        try {
          const [vocRes, proRes, synRes] = await Promise.all([
            parseTags(vocalists).length > 0
              ? api.resolveArtists("vocalist", parseTags(vocalists))
              : Promise.resolve({ data: [] }),
            parseTags(producers).length > 0
              ? api.resolveArtists("producer", parseTags(producers))
              : Promise.resolve({ data: [] }),
            parseTags(synthesizers).length > 0
              ? api.resolveArtists("synthesizer", parseTags(synthesizers))
              : Promise.resolve({ data: [] }),
          ]);
          await api.editSong({
            id: result.new_song_id,
            type: newType,
            vocalist_ids: vocRes.data.map((a) => a.id),
            producer_ids: proRes.data.map((a) => a.id),
            synthesizer_ids: synRes.data.map((a) => a.id),
          });
        } catch {
          toast.warning("视频已移动，但新歌曲属性设置失败，请到歌曲编辑补充");
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
            ? { toSong: { id: targetSong!.id, name: targetSong!.name } }
            : { newSongName: newName.trim() }),
        },
      });

      toast.success("视频移动成功");
      onOpenChange(false);
      onDone?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "移动失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "confirm") {
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={(v) => {
          if (!v) setStep("form");
          onOpenChange(v);
        }}
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
            从: {parentSong?.name ?? `歌曲ID ${parentSong?.id}`}
          </p>
          <p className="text-xs text-muted-foreground">
            到:{" "}
            {mode === "existing" ? targetSong?.name : `新歌曲「${newName}」`}
          </p>
        </div>
      </ConfirmDialog>
    );
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="拆分/移动视频"
      onConfirm={() => setStep("confirm")}
      confirm={canSubmit ? "下一步" : "请完成选择"}
      loading={false}
    >
      <div className="space-y-4">
        <div className="p-3 bg-muted/50 rounded-md text-sm">
          <div className="font-medium truncate">{videoTitle}</div>
          <div className="text-xs text-muted-foreground font-mono">{bvid}</div>
          {parentSong && (
            <div className="text-xs text-muted-foreground mt-1">
              当前: {parentSong.name} (ID: {parentSong.id})
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>目标</Label>
          <Select
            value={mode}
            onValueChange={(v: "existing" | "new") => {
              setMode(v);
              setTargetSong(null);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="existing">已有歌曲</SelectItem>
              <SelectItem value="new">新歌曲</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mode === "existing" && (
          <div className="space-y-2">
            <Label>目标歌曲</Label>
            <EntityPicker
              kind="song"
              value={targetSong}
              onChange={setTargetSong}
              placeholder="搜索目标歌曲"
            />
          </div>
        )}

        {mode === "new" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">歌曲名称</Label>
              <Input
                placeholder="输入新歌曲名称"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">类型</Label>
              <Select
                value={newType}
                onValueChange={(v: SongType) => setNewType(v)}
              >
                <SelectTrigger>
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
            {parentSong && (
              <p className="text-[10px] text-muted-foreground">
                以下艺人从原歌曲继承，可修改
              </p>
            )}
            <ArtistFields
              vocalists={vocalists}
              producers={producers}
              synthesizers={synthesizers}
              onVocalistsChange={setVocalists}
              onProducersChange={setProducers}
              onSynthesizersChange={setSynthesizers}
            />
          </div>
        )}
      </div>
    </ConfirmDialog>
  );
}
