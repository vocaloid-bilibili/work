// src/modules/editor/panels/MergeSongPanel.tsx
import { useState } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Card, CardContent } from "@/ui/card";
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
  presetSource?: Song;
  onDone: () => void;
  onCancel: () => void;
}

export default function MergeSongPanel({
  presetSource,
  onDone,
  onCancel,
}: Props) {
  const loader = useSongLoader();
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [target, setTarget] = useState<{ id: number; name: string } | null>(
    null,
  );
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const source = presetSource ?? loader.song;
  const canSubmit =
    source &&
    ((mode === "existing" && target && source.id !== target.id) ||
      (mode === "new" && newName.trim()));

  const confirm = async () => {
    if (!source) return;
    setLoading(true);
    try {
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
      setConfirmOpen(false);
      onDone();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "合并失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground text-center">
        将源歌曲的视频和艺人转移到目标歌曲，然后删除源歌曲
      </p>
      <Card>
        <CardContent className="pt-5 space-y-5">
          {presetSource ? (
            <SongInfoCard song={presetSource} />
          ) : (
            <div className="space-y-2">
              <Label>源歌曲（将被删除）</Label>
              <EntityPicker
                kind="song"
                value={source ? { id: source.id, name: source.name } : null}
                onChange={loader.load}
              />
              {source && <SongInfoCard song={source} />}
            </div>
          )}
          <div className="flex justify-center">
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
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              取消
            </Button>
            <Button
              className="flex-1"
              disabled={!canSubmit}
              onClick={() => setConfirmOpen(true)}
            >
              合并歌曲
            </Button>
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
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
          </div>
          <div className="p-3 bg-primary/10 rounded">
            <div className="text-xs text-muted-foreground">保留</div>
            <div className="font-medium">
              {mode === "existing" ? target?.name : `新歌曲: ${newName}`}
            </div>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
