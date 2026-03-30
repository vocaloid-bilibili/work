// src/modules/catalog/ArtistMerger.tsx

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
import EntityPicker, { type EntityKind } from "@/shared/ui/EntityPicker";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";

const ARTIST_TYPES = [
  { label: "歌手", value: "vocalist" as const },
  { label: "作者", value: "producer" as const },
  { label: "引擎", value: "synthesizer" as const },
];

type ArtistType = "vocalist" | "producer" | "synthesizer";
interface Entity {
  id: number;
  name: string;
}

export default function ArtistMerger() {
  const [artistType, setArtistType] = useState<ArtistType>("vocalist");
  const [source, setSource] = useState<Entity | null>(null);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [target, setTarget] = useState<Entity | null>(null);
  const [newArtistName, setNewArtistName] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleTypeChange = (type: ArtistType) => {
    setArtistType(type);
    setSource(null);
    setTarget(null);
    setNewArtistName("");
  };

  const getTypeLabel = (type: string) =>
    ARTIST_TYPES.find((t) => t.value === type)?.label || type;

  const canSubmit =
    source &&
    ((mode === "existing" && target && source.id !== target.id) ||
      (mode === "new" && newArtistName.trim()));

  const handleMerge = () => {
    if (!source) {
      toast.warning("请选择源艺人");
      return;
    }
    if (mode === "existing" && !target) {
      toast.warning("请选择目标艺人");
      return;
    }
    if (mode === "existing" && source.id === target!.id) {
      toast.warning("源艺人和目标艺人不能相同");
      return;
    }
    if (mode === "new" && !newArtistName.trim()) {
      toast.warning("请输入新艺人名称");
      return;
    }
    setOpen(true);
  };

  const confirm = async () => {
    if (!source) return;
    try {
      setLoading(true);
      const result = await api.mergeArtist(
        artistType,
        source.id,
        mode === "existing" ? target?.id : undefined,
        mode === "new" ? newArtistName.trim() : undefined,
      );
      toast.success(`艺人合并成功，影响 ${result.songs_affected || 0} 首歌曲`);
      setOpen(false);

      logEdit({
        targetType: "artist",
        targetId:
          mode === "existing" ? String(target!.id) : newArtistName.trim(),
        action: "merge_artist",
        detail: {
          artistType,
          source: { id: source.id, name: source.name },
          ...(mode === "existing"
            ? { target: { id: target!.id, name: target!.name } }
            : { newArtistName: newArtistName.trim() }),
          songsAffected: result.songs_affected || 0,
        },
      });

      setSource(null);
      setTarget(null);
      setNewArtistName("");
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
            合并艺人
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground text-center">
            将源艺人的所有歌曲关联转移到目标艺人，然后删除源艺人
          </div>

          <div className="space-y-2">
            <Label>艺人类型</Label>
            <Select value={artistType} onValueChange={handleTypeChange}>
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
            <Label>源{getTypeLabel(artistType)}（被删除）</Label>
            <EntityPicker
              kind={artistType as EntityKind}
              value={source}
              onChange={setSource}
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
                setNewArtistName("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="existing">
                  合并到已有{getTypeLabel(artistType)}
                </SelectItem>
                <SelectItem value="new">
                  合并到新{getTypeLabel(artistType)}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "existing" && (
            <div className="space-y-2">
              <Label>目标{getTypeLabel(artistType)}（保留）</Label>
              <EntityPicker
                kind={artistType as EntityKind}
                value={target}
                onChange={setTarget}
              />
            </div>
          )}

          {mode === "new" && (
            <div className="space-y-2">
              <Label>新{getTypeLabel(artistType)}名称</Label>
              <Input
                placeholder={`输入新${getTypeLabel(artistType)}名称`}
                value={newArtistName}
                onChange={(e) => setNewArtistName(e.target.value)}
              />
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleMerge}
            disabled={!canSubmit}
          >
            合并{getTypeLabel(artistType)}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`确认合并${getTypeLabel(artistType)}`}
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
              {mode === "existing"
                ? target?.name
                : `新${getTypeLabel(artistType)}: ${newArtistName}`}
            </div>
            {mode === "existing" && target && (
              <div className="text-xs text-muted-foreground">
                ID: {target.id}
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground p-3 bg-muted rounded">
            源艺人的所有歌曲关联将转移到目标艺人，然后删除源艺人。
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
