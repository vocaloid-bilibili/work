// src/modules/catalog/SongMerger.tsx

import { useState } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
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

interface Entity {
  id: number;
  name: string;
}

export default function SongMerger() {
  const [source, setSource] = useState<Entity | null>(null);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [target, setTarget] = useState<Entity | null>(null);
  const [newSongName, setNewSongName] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const canSubmit =
    source &&
    ((mode === "existing" && target && source.id !== target.id) ||
      (mode === "new" && newSongName.trim()));

  const handleMerge = () => {
    if (!source) {
      toast.warning("请选择源歌曲");
      return;
    }
    if (mode === "existing" && !target) {
      toast.warning("请选择目标歌曲");
      return;
    }
    if (mode === "existing" && source.id === target!.id) {
      toast.warning("源歌曲和目标歌曲不能相同");
      return;
    }
    if (mode === "new" && !newSongName.trim()) {
      toast.warning("请输入新歌曲名称");
      return;
    }
    setOpen(true);
  };

  const confirm = async () => {
    if (!source) return;
    try {
      setLoading(true);
      await api.mergeSong(
        source.id,
        mode === "existing" ? target?.id : undefined,
        mode === "new" ? newSongName.trim() : undefined,
      );
      toast.success("歌曲合并成功");
      setOpen(false);

      logEdit({
        targetType: "song",
        targetId: mode === "existing" ? String(target!.id) : newSongName.trim(),
        action: "merge_song",
        detail: {
          source: { id: source.id, name: source.name },
          ...(mode === "existing"
            ? { target: { id: target!.id, name: target!.name } }
            : { newSongName: newSongName.trim() }),
        },
      });

      setSource(null);
      setTarget(null);
      setNewSongName("");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "合并失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">
            合并歌曲
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground text-center">
            将源歌曲的视频和艺人关联转移到目标歌曲，然后删除源歌曲
          </div>

          <div className="space-y-2">
            <Label>源歌曲（被删除）</Label>
            <EntityPicker
              kind="song"
              value={source}
              onChange={setSource}
              placeholder="搜索要删除的歌曲"
            />
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <Label>目标类型</Label>
            <Select
              value={mode}
              onValueChange={(v: "existing" | "new") => {
                setMode(v);
                setTarget(null);
                setNewSongName("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="existing">合并到已有歌曲</SelectItem>
                <SelectItem value="new">合并到新歌曲</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "existing" && (
            <div className="space-y-2">
              <Label>目标歌曲（保留）</Label>
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
                value={newSongName}
                onChange={(e) => setNewSongName(e.target.value)}
              />
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleMerge}
            disabled={!canSubmit}
          >
            合并歌曲
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="确认合并歌曲"
        variant="destructive"
        loading={loading}
        onConfirm={confirm}
        confirm="确认合并"
      >
        <div className="space-y-3">
          <div className="p-3 bg-destructive/10 rounded">
            <div className="text-sm text-muted-foreground">删除</div>
            <div className="font-medium">{source?.name}</div>
            <div className="text-xs text-muted-foreground">
              ID: {source?.id}
            </div>
          </div>
          <div className="p-3 bg-primary/10 rounded">
            <div className="text-sm text-muted-foreground">保留</div>
            <div className="font-medium">
              {mode === "existing" ? target?.name : `新歌曲: ${newSongName}`}
            </div>
            {mode === "existing" && target && (
              <div className="text-xs text-muted-foreground">
                ID: {target.id}
              </div>
            )}
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
