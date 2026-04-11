// src/modules/editor/views/MergeArtist.tsx
import { useState } from "react";
import { ArrowDown } from "lucide-react";
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
import EntityPicker, { type EntityKind } from "@/shared/ui/EntityPicker";
import { ARTIST_TYPES, type ArtistType } from "@/core/types/constants";
import { useEditor } from "../ctx";
import { Field } from "../components/Field";
import { Input } from "../components/Input";
import { Btn } from "../components/Btn";
import { Confirm } from "../components/Confirm";

interface Entity {
  id: number;
  name: string;
}

export function MergeArtistView() {
  const { back } = useEditor();
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

  const reset = () => {
    setSource(null);
    setTarget(null);
    setNewName("");
  };

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
      back();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "合并失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground text-center">
        将源艺人的所有歌曲关联转移到目标艺人
      </p>

      {/* 不用 Section 包裹，避免 EntityPicker 下拉被裁 */}
      <div className="space-y-5">
        <Field label="艺人类型">
          <Select
            value={at}
            onValueChange={(v: ArtistType) => {
              setAt(v);
              reset();
            }}
          >
            <SelectTrigger className="h-9">
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
        </Field>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-destructive/80">
            源{lbl}（将被删除）
          </label>
          <EntityPicker
            kind={at as EntityKind}
            value={source}
            onChange={setSource}
          />
        </div>

        <div className="flex justify-center">
          <ArrowDown className="h-5 w-5 text-muted-foreground/30" />
        </div>

        <div className="space-y-3">
          <Field label="合并到">
            <Select
              value={mode}
              onValueChange={(v: "existing" | "new") => {
                setMode(v);
                setTarget(null);
                setNewName("");
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="existing">已有{lbl}</SelectItem>
                <SelectItem value="new">新{lbl}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {mode === "existing" && (
            <EntityPicker
              kind={at as EntityKind}
              value={target}
              onChange={setTarget}
            />
          )}
          {mode === "new" && (
            <Input
              placeholder={`输入新${lbl}名称`}
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewName(e.target.value)
              }
            />
          )}
        </div>

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
            合并{lbl}
          </Btn>
        </div>
      </div>

      <Confirm
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`确认合并${lbl}`}
        variant="destructive"
        loading={loading}
        onConfirm={confirm}
        confirm="确认合并"
      >
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-destructive/10 rounded-xl">
            <p className="text-[10px] text-muted-foreground">删除</p>
            <p className="font-semibold wrap-break-wordword">{source?.name}</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-xl">
            <p className="text-[10px] text-muted-foreground">保留</p>
            <p className="font-semibold wrap-break-word">
              {mode === "existing" ? target?.name : `新${lbl}：${newName}`}
            </p>
          </div>
        </div>
      </Confirm>
    </div>
  );
}
