// src/modules/editor/panels/MergeArtistPanel.tsx
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
import EntityPicker, { type EntityKind } from "@/shared/ui/EntityPicker";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import { ARTIST_TYPES } from "@/core/types/constants";
import type { ArtistType } from "@/core/types/constants";

interface Entity {
  id: number;
  name: string;
}
interface Props {
  onDone: () => void;
  onCancel: () => void;
}

export default function MergeArtistPanel({ onDone, onCancel }: Props) {
  const [at, setAt] = useState<ArtistType>("vocalist");
  const [source, setSource] = useState<Entity | null>(null);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [target, setTarget] = useState<Entity | null>(null);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const lbl = ARTIST_TYPES.find((t) => t.value === at)?.label ?? "";
  const canSubmit =
    source &&
    ((mode === "existing" && target && source.id !== target.id) ||
      (mode === "new" && newName.trim()));

  const confirm = async () => {
    if (!source) return;
    setLoading(true);
    try {
      const r = await api.mergeArtist(
        at,
        source.id,
        mode === "existing" ? target?.id : undefined,
        mode === "new" ? newName.trim() : undefined,
      );
      logEdit({
        targetType: "artist",
        targetId: mode === "existing" ? String(target!.id) : newName.trim(),
        action: "merge_artist",
        detail: {
          artistType: at,
          source: { id: source.id, name: source.name },
          ...(mode === "existing"
            ? { target: { id: target!.id, name: target!.name } }
            : { newArtistName: newName.trim() }),
          songsAffected: r.songs_affected,
        },
      });
      toast.success(`合并成功，影响 ${r.songs_affected} 首歌曲`);
      setConfirmOpen(false);
      onDone();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "合并失败");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSource(null);
    setTarget(null);
    setNewName("");
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground text-center">
        将源艺人的所有歌曲关联转移到目标艺人
      </p>
      <Card>
        <CardContent className="pt-5 space-y-5">
          <div className="space-y-2">
            <Label>艺人类型</Label>
            <Select
              value={at}
              onValueChange={(v: ArtistType) => {
                setAt(v);
                reset();
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ARTIST_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>源{lbl}（删除）</Label>
            <EntityPicker
              kind={at as EntityKind}
              value={source}
              onChange={setSource}
            />
          </div>
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
                <SelectItem value="existing">已有{lbl}</SelectItem>
                <SelectItem value="new">新{lbl}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === "existing" && (
            <div className="space-y-2">
              <Label>目标{lbl}</Label>
              <EntityPicker
                kind={at as EntityKind}
                value={target}
                onChange={setTarget}
              />
            </div>
          )}
          {mode === "new" && (
            <div className="space-y-2">
              <Label>新{lbl}名称</Label>
              <Input
                placeholder={`输入新${lbl}名称`}
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
              合并{lbl}
            </Button>
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`确认合并${lbl}`}
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
              {mode === "existing" ? target?.name : `新${lbl}: ${newName}`}
            </div>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
