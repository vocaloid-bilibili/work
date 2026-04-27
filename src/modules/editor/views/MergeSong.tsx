// src/modules/editor/views/MergeSong.tsx
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
import EntityPicker from "@/shared/ui/EntityPicker";
import { useEditor } from "../ctx";
import { Field } from "../components/Field";
import { Input } from "../components/Input";
import { Btn } from "../components/Btn";
import { SongCard } from "../components/SongCard";
import { Confirm } from "../components/Confirm";
import type { Song } from "@/core/types/catalog";

function useSongLoader2() {
  const [song, setSong] = useState<Song | null>(null);
  const load = async (item: { id: number; name: string } | null) => {
    if (!item) {
      setSong(null);
      return;
    }
    try {
      const r = await api.selectSong(item.id);
      setSong(r.data);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "加载失败");
      setSong(null);
    }
  };
  return { song, load };
}

export function MergeSongView({ preset }: { preset?: Song }) {
  const { back } = useEditor();
  const loader = useSongLoader2();
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [target, setTarget] = useState<{ id: number; name: string } | null>(
    null,
  );
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const source = preset ?? loader.song;
  const canSubmit =
    source &&
    ((mode === "existing" && target && source.id !== target.id) ||
      (mode === "new" && newName.trim()));

  const confirm = async () => {
    if (!source) return;
    setLoading(true);
    try {
      const r = await api.mergeSong(
        source.id,
        mode === "existing" ? target?.id : undefined,
        mode === "new" ? newName.trim() : undefined,
      );
      await logEdit({
        targetType: "song",
        targetId: String(r.into),
        action: "merge_song",
        detail: {
          source: { id: source.id, name: source.name },
          ...(mode === "existing"
            ? { target: { id: target!.id, name: target!.name } }
            : { newSongName: newName.trim(), newSongId: r.into }),
        },
      });
      await toast.success("歌曲合并成功");
      setConfirmOpen(false);
      back();
    } catch (e: any) {
      await toast.error(e?.response?.data?.detail || "合并失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground text-center">
        将源歌曲的视频和艺人转移到目标，然后删除源歌曲
      </p>

      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-destructive/80">
          源歌曲（将被删除）
        </label>
        {preset ? (
          <SongCard song={preset} compact />
        ) : (
          <>
            <EntityPicker
              kind="song"
              value={source ? { id: source.id, name: source.name } : null}
              onChange={loader.load}
            />
            {source && <SongCard song={source} compact />}
          </>
        )}
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
              <SelectItem value="existing">已有歌曲</SelectItem>
              <SelectItem value="new">新歌曲</SelectItem>
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
          <Input
            placeholder="输入新歌曲名称"
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
          合并歌曲
        </Btn>
      </div>

      <Confirm
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="确认合并歌曲"
        variant="destructive"
        loading={loading}
        onConfirm={confirm}
        confirm="确认合并"
      >
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-destructive/10 rounded-xl">
            <p className="text-[10px] text-muted-foreground">删除</p>
            <p className="font-semibold wrap-break-word">{source?.name}</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-xl">
            <p className="text-[10px] text-muted-foreground">保留</p>
            <p className="font-semibold wrap-break-word">
              {mode === "existing" ? target?.name : `新歌曲：${newName}`}
            </p>
          </div>
        </div>
      </Confirm>
    </div>
  );
}
