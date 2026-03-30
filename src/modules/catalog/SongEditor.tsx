// src/modules/catalog/SongEditor.tsx

import { useState, useMemo } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Label } from "@/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import EntityPicker from "@/shared/ui/EntityPicker";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import type { Song, SongType, Artist } from "@/core/types/catalog";

const SONG_TYPES: SongType[] = ["原创", "翻唱", "本家重置", "串烧"];

interface EditForm {
  id: number;
  display_name: string;
  type: SongType;
  vocalist_ids: number[];
  producer_ids: number[];
  synthesizer_ids: number[];
}

export default function SongEditor() {
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [songInfo, setSongInfo] = useState<Song | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const hasChanges = useMemo(() => {
    if (!songInfo || !form) return false;
    const orig = {
      display_name: songInfo.display_name || "",
      type: songInfo.type,
      vocalist_ids: (songInfo.vocalists || []).map((a) => a.id).sort(),
      producer_ids: (songInfo.producers || []).map((a) => a.id).sort(),
      synthesizer_ids: (songInfo.synthesizers || []).map((a) => a.id).sort(),
    };
    const cur = {
      display_name: form.display_name,
      type: form.type,
      vocalist_ids: [...form.vocalist_ids].sort(),
      producer_ids: [...form.producer_ids].sort(),
      synthesizer_ids: [...form.synthesizer_ids].sort(),
    };
    return JSON.stringify(orig) !== JSON.stringify(cur);
  }, [songInfo, form]);

  const handleSelect = async (item: { id: number; name: string } | null) => {
    if (!item) {
      setSongInfo(null);
      setForm(null);
      return;
    }
    try {
      const result = await api.selectSong(item.id);
      const d = result.data;
      setSongInfo(d);
      setForm({
        id: d.id,
        display_name: d.display_name || "",
        type: d.type,
        vocalist_ids: (d.vocalists || []).map((a: Artist) => a.id),
        producer_ids: (d.producers || []).map((a: Artist) => a.id),
        synthesizer_ids: (d.synthesizers || []).map((a: Artist) => a.id),
      });
      toast.success("歌曲信息获取成功");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "获取歌曲信息失败");
    }
  };

  const addArtist = (
    type: "vocalist" | "producer" | "synthesizer",
    artist: { id: number; name: string },
  ) => {
    if (!form || !songInfo) return;
    const key = `${type}_ids` as keyof EditForm;
    const ids = form[key] as number[];
    if (!ids.includes(artist.id)) {
      setForm({ ...form, [key]: [...ids, artist.id] });
      const listKey = `${type}s` as keyof Song;
      const list = (songInfo[listKey] as Artist[]) || [];
      if (!list.find((a) => a.id === artist.id)) {
        setSongInfo({
          ...songInfo,
          [listKey]: [...list, { id: artist.id, name: artist.name }],
        });
      }
    }
  };

  const removeArtist = (
    type: "vocalist" | "producer" | "synthesizer",
    id: number,
  ) => {
    if (!form) return;
    const key = `${type}_ids` as keyof EditForm;
    const ids = form[key] as number[];
    setForm({ ...form, [key]: ids.filter((i) => i !== id) });
  };

  const getArtistName = (
    type: "vocalist" | "producer" | "synthesizer",
    id: number,
  ) => {
    const list = songInfo?.[`${type}s` as keyof Song] as Artist[] | undefined;
    return list?.find((a) => a.id === id)?.name || `ID: ${id}`;
  };

  const confirmEdit = async () => {
    if (!form || !songInfo) return;
    try {
      setSubmitting(true);
      await api.editSong({
        id: form.id,
        display_name: form.display_name || undefined,
        type: form.type,
        vocalist_ids: form.vocalist_ids,
        producer_ids: form.producer_ids,
        synthesizer_ids: form.synthesizer_ids,
      });
      toast.success("歌曲信息更新成功");
      setConfirmOpen(false);

      logEdit({
        targetType: "song",
        targetId: String(form.id),
        action: "edit_song",
        detail: {
          name: songInfo.name,
          changes: {
            ...(form.display_name !== (songInfo.display_name || "")
              ? {
                  display_name: {
                    old: songInfo.display_name || "",
                    new: form.display_name,
                  },
                }
              : {}),
            ...(form.type !== songInfo.type
              ? { type: { old: songInfo.type, new: form.type } }
              : {}),
            ...(JSON.stringify([...form.vocalist_ids].sort()) !==
            JSON.stringify((songInfo.vocalists || []).map((a) => a.id).sort())
              ? {
                  vocalist_ids: {
                    old: (songInfo.vocalists || []).map((a) => a.id),
                    new: form.vocalist_ids,
                  },
                }
              : {}),
            ...(JSON.stringify([...form.producer_ids].sort()) !==
            JSON.stringify((songInfo.producers || []).map((a) => a.id).sort())
              ? {
                  producer_ids: {
                    old: (songInfo.producers || []).map((a) => a.id),
                    new: form.producer_ids,
                  },
                }
              : {}),
            ...(JSON.stringify([...form.synthesizer_ids].sort()) !==
            JSON.stringify(
              (songInfo.synthesizers || []).map((a) => a.id).sort(),
            )
              ? {
                  synthesizer_ids: {
                    old: (songInfo.synthesizers || []).map((a) => a.id),
                    new: form.synthesizer_ids,
                  },
                }
              : {}),
          },
        },
      });

      handleSelect({ id: songInfo.id, name: songInfo.name });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "更新失败");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!songInfo) return;
    try {
      setDeleting(true);
      await api.deleteSong(songInfo.id);
      toast.success("歌曲删除成功");
      setDeleteOpen(false);

      logEdit({
        targetType: "song",
        targetId: String(songInfo.id),
        action: "delete_song",
        detail: { name: songInfo.name },
      });

      setSongInfo(null);
      setForm(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "删除失败");
    } finally {
      setDeleting(false);
    }
  };

  const ArtistSection = ({
    label,
    type,
  }: {
    label: string;
    type: "vocalist" | "producer" | "synthesizer";
  }) => {
    const ids = (form?.[`${type}_ids` as keyof EditForm] as number[]) || [];
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex flex-wrap gap-2 min-h-8">
          {ids.map((id) => (
            <Badge key={id} variant="secondary" className="gap-1 py-1">
              {getArtistName(type, id)}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => removeArtist(type, id)}
              />
            </Badge>
          ))}
        </div>
        <EntityPicker
          kind={type}
          value={null}
          onChange={(item) => item && addArtist(type, item)}
          placeholder={`添加${label}`}
        />
      </div>
    );
  };

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">
            编辑歌曲信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>选择歌曲</Label>
            <EntityPicker
              kind="song"
              value={songInfo ? { id: songInfo.id, name: songInfo.name } : null}
              onChange={handleSelect}
            />
          </div>

          {form && songInfo && (
            <div className="border-t pt-5 space-y-5">
              <div className="space-y-2">
                <Label>歌曲名称</Label>
                <Input value={songInfo.name} disabled />
              </div>

              <div className="space-y-2">
                <Label>显示名称</Label>
                <Input
                  value={form.display_name}
                  placeholder="留空则使用歌曲名称"
                  onChange={(e) =>
                    setForm({ ...form, display_name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>类型</Label>
                <Select
                  value={form.type}
                  onValueChange={(v: SongType) => setForm({ ...form, type: v })}
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

              <ArtistSection label="歌手" type="vocalist" />
              <ArtistSection label="作者" type="producer" />
              <ArtistSection label="引擎" type="synthesizer" />

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  onClick={() =>
                    hasChanges
                      ? setConfirmOpen(true)
                      : toast.warning("没有检测到任何变化")
                  }
                  disabled={submitting || !hasChanges}
                >
                  {hasChanges ? "提交更新" : "无变化"}
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="确认更新歌曲信息"
        loading={submitting}
        onConfirm={confirmEdit}
        confirm="确认更新"
      >
        <p className="text-sm">确定要更新歌曲 "{songInfo?.name}" 的信息吗？</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="确认删除歌曲"
        variant="destructive"
        loading={deleting}
        onConfirm={confirmDelete}
        confirm="确认删除"
      >
        <p className="text-sm text-destructive">
          确定要删除歌曲 "{songInfo?.name}"
          吗？此操作会删除所有关联视频和快照，且不可恢复！
        </p>
      </ConfirmDialog>
    </div>
  );
}
