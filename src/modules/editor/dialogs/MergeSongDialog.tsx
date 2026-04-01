// src/modules/editor/dialogs/MergeSongDialog.tsx
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
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import EntityPicker from "@/shared/ui/EntityPicker";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import SongInfoCard from "../shared/SongInfoCard";
import { useSongLoader } from "../hooks/useSongLoader";
import type { Song } from "@/core/types/catalog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** 如果从 SongWorkspace 触发，预设源歌曲 */
  presetSource?: Song | null;
  onDone?: () => void;
}

export default function MergeSongDialog({
  open,
  onOpenChange,
  presetSource,
  onDone,
}: Props) {
  const sourceLoader = useSongLoader();
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [target, setTarget] = useState<{ id: number; name: string } | null>(
    null,
  );
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");

  const source = presetSource ?? sourceLoader.song;

  useEffect(() => {
    if (open && presetSource) {
      sourceLoader.clear();
    }
    if (!open) {
      setStep("form");
      setTarget(null);
      setNewName("");
      setMode("existing");
      if (!presetSource) sourceLoader.clear();
    }
  }, [open]);

  const canSubmit =
    source &&
    ((mode === "existing" && target && source.id !== target.id) ||
      (mode === "new" && newName.trim()));

  const confirm = async () => {
    if (!source) return;
    try {
      setLoading(true);
      await api.mergeSong(
        source.id,
        mode === "existing" ? target?.id : undefined,
        mode === "new" ? newName.trim() : undefined,
      );
      logEdit({
        targetType: "song",
        targetId: mode === "existing" ? String(target!.id) : newName.trim(),
        action: "merge_song",
        detail: {
          source: { id: source.id, name: source.name },
          ...(mode === "existing"
            ? { target: { id: target!.id, name: target!.name } }
            : { newSongName: newName.trim() }),
        },
      });
      toast.success("歌曲合并成功");
      onOpenChange(false);
      onDone?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "合并失败");
    } finally {
      setLoading(false);
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
        title="确认合并歌曲"
        variant="destructive"
        loading={loading}
        onConfirm={confirm}
        confirm="确认合并"
      >
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-destructive/10 rounded">
            <div className="text-xs text-muted-foreground">删除</div>
            <div className="font-medium">{source?.name}</div>
            <div className="text-xs text-muted-foreground">
              {source?.videos?.length ?? 0} 个视频将转移
            </div>
          </div>
          <div className="p-3 bg-primary/10 rounded">
            <div className="text-xs text-muted-foreground">保留</div>
            <div className="font-medium">
              {mode === "existing" ? target?.name : `新歌曲: ${newName}`}
            </div>
          </div>
        </div>
      </ConfirmDialog>
    );
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="合并歌曲"
      onConfirm={() => setStep("confirm")}
      confirm="下一步"
      loading={false}
    >
      <div className="space-y-4">
        {!presetSource && (
          <div className="space-y-2">
            <Label>源歌曲（将被删除）</Label>
            <EntityPicker
              kind="song"
              value={source ? { id: source.id, name: source.name } : null}
              onChange={sourceLoader.load}
            />
            {source && <SongInfoCard song={source} />}
          </div>
        )}
        {presetSource && <SongInfoCard song={presetSource} />}

        <div className="flex items-center justify-center">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <Label>目标</Label>
          <Select
            value={mode}
            onValueChange={(v: "existing" | "new") => {
              setMode(v);
              setTarget(null);
              setNewName("");
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
              value={target}
              onChange={setTarget}
              placeholder="搜索目标歌曲"
            />
          </div>
        )}
        {mode === "new" && (
          <div className="space-y-2">
            <Label>新歌曲名称</Label>
            <Input
              placeholder="输入新歌曲名称"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
        )}

        {!canSubmit && (
          <p className="text-xs text-muted-foreground">请完成所有选择后继续</p>
        )}
      </div>
    </ConfirmDialog>
  );
}
