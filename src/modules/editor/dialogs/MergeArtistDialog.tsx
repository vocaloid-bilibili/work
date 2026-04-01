// src/modules/editor/dialogs/MergeArtistDialog.tsx
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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function MergeArtistDialog({ open, onOpenChange }: Props) {
  const [artistType, setArtistType] = useState<ArtistType>("vocalist");
  const [source, setSource] = useState<Entity | null>(null);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [target, setTarget] = useState<Entity | null>(null);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");

  useEffect(() => {
    if (!open) {
      setStep("form");
      setSource(null);
      setTarget(null);
      setNewName("");
    }
  }, [open]);

  const label = ARTIST_TYPES.find((t) => t.value === artistType)?.label ?? "";
  const canSubmit =
    source &&
    ((mode === "existing" && target && source.id !== target.id) ||
      (mode === "new" && newName.trim()));

  const confirm = async () => {
    if (!source) return;
    try {
      setLoading(true);
      const result = await api.mergeArtist(
        artistType,
        source.id,
        mode === "existing" ? target?.id : undefined,
        mode === "new" ? newName.trim() : undefined,
      );
      logEdit({
        targetType: "artist",
        targetId: mode === "existing" ? String(target!.id) : newName.trim(),
        action: "merge_artist",
        detail: {
          artistType,
          source: { id: source.id, name: source.name },
          ...(mode === "existing"
            ? { target: { id: target!.id, name: target!.name } }
            : { newArtistName: newName.trim() }),
          songsAffected: result.songs_affected,
        },
      });
      toast.success(`合并成功，影响 ${result.songs_affected} 首歌曲`);
      onOpenChange(false);
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
        title={`确认合并${label}`}
        variant="destructive"
        loading={loading}
        onConfirm={confirm}
        confirm="确认合并"
      >
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-destructive/10 rounded">
            <div className="text-xs text-muted-foreground">删除</div>
            <div className="font-medium">
              {source?.name}{" "}
              <span className="text-xs text-muted-foreground">
                ID: {source?.id}
              </span>
            </div>
          </div>
          <div className="p-3 bg-primary/10 rounded">
            <div className="text-xs text-muted-foreground">保留</div>
            <div className="font-medium">
              {mode === "existing" ? target?.name : `新${label}: ${newName}`}
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
      title="合并艺人"
      onConfirm={() => setStep("confirm")}
      confirm={canSubmit ? "下一步" : "请完成选择"}
      loading={false}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>艺人类型</Label>
          <Select
            value={artistType}
            onValueChange={(v: ArtistType) => {
              setArtistType(v);
              setSource(null);
              setTarget(null);
              setNewName("");
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
          <Label>源{label}（将被删除）</Label>
          <EntityPicker
            kind={artistType as EntityKind}
            value={source}
            onChange={setSource}
          />
        </div>

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
              <SelectItem value="existing">已有{label}</SelectItem>
              <SelectItem value="new">新{label}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mode === "existing" && (
          <div className="space-y-2">
            <Label>目标{label}（保留）</Label>
            <EntityPicker
              kind={artistType as EntityKind}
              value={target}
              onChange={setTarget}
            />
          </div>
        )}
        {mode === "new" && (
          <div className="space-y-2">
            <Label>新{label}名称</Label>
            <Input
              placeholder={`输入新${label}名称`}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
        )}
      </div>
    </ConfirmDialog>
  );
}
