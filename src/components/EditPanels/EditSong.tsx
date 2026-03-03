// src/components/EditPanels/EditSong.tsx
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/utils/api";
import EntitySearch from "./EntitySearch";
import type { SongInfo, SongType, Artist } from "@/utils/types";

const songTypes: SongType[] = ["原创", "翻唱", "本家重置", "串烧"];

interface EditForm {
  id: number;
  display_name: string;
  type: SongType;
  vocalist_ids: number[];
  producer_ids: number[];
  synthesizer_ids: number[];
}

export default function EditSong() {
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [songInfo, setSongInfo] = useState<SongInfo | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const hasChanges = useMemo(() => {
    if (!songInfo || !editForm) return false;
    const original = {
      display_name: songInfo.display_name || "",
      type: songInfo.type,
      vocalist_ids: (songInfo.vocalists || []).map((a) => a.id).sort(),
      producer_ids: (songInfo.producers || []).map((a) => a.id).sort(),
      synthesizer_ids: (songInfo.synthesizers || []).map((a) => a.id).sort(),
    };
    const current = {
      display_name: editForm.display_name,
      type: editForm.type,
      vocalist_ids: [...editForm.vocalist_ids].sort(),
      producer_ids: [...editForm.producer_ids].sort(),
      synthesizer_ids: [...editForm.synthesizer_ids].sort(),
    };
    return JSON.stringify(original) !== JSON.stringify(current);
  }, [songInfo, editForm]);

  const handleSongSelect = async (
    item: { id: number; name: string } | null,
  ) => {
    if (!item) {
      setSongInfo(null);
      setEditForm(null);
      return;
    }

    try {
      const result = await api.selectSong(item.id);
      const data = result.data;
      setSongInfo(data);
      setEditForm({
        id: data.id,
        display_name: data.display_name || "",
        type: data.type,
        vocalist_ids: (data.vocalists || []).map((a: Artist) => a.id),
        producer_ids: (data.producers || []).map((a: Artist) => a.id),
        synthesizer_ids: (data.synthesizers || []).map((a: Artist) => a.id),
      });
      toast.success("歌曲信息获取成功");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "获取歌曲信息失败");
    }
  };

  const addArtist = (
    type: "vocalist" | "producer" | "synthesizer",
    artist: { id: number; name: string },
  ) => {
    if (!editForm || !songInfo) return;
    const key = `${type}_ids` as keyof EditForm;
    const ids = editForm[key] as number[];
    if (!ids.includes(artist.id)) {
      setEditForm({ ...editForm, [key]: [...ids, artist.id] });
      // 更新 songInfo 用于显示名称
      const listKey = `${type}s` as keyof SongInfo;
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
    if (!editForm) return;
    const key = `${type}_ids` as keyof EditForm;
    const ids = editForm[key] as number[];
    setEditForm({ ...editForm, [key]: ids.filter((i) => i !== id) });
  };

  const getArtistName = (
    type: "vocalist" | "producer" | "synthesizer",
    id: number,
  ) => {
    const list = songInfo?.[`${type}s` as keyof SongInfo] as
      | Artist[]
      | undefined;
    return list?.find((a) => a.id === id)?.name || `ID: ${id}`;
  };

  const handleSubmit = () => {
    if (!editForm) return;
    if (!hasChanges) {
      toast.warning("没有检测到任何变化");
      return;
    }
    setDialogVisible(true);
  };

  const confirmEdit = async () => {
    if (!editForm) return;
    try {
      setSubmitting(true);
      await api.editSong({
        id: editForm.id,
        display_name: editForm.display_name || undefined,
        type: editForm.type,
        vocalist_ids: editForm.vocalist_ids,
        producer_ids: editForm.producer_ids,
        synthesizer_ids: editForm.synthesizer_ids,
      });
      toast.success("歌曲信息更新成功");
      setDialogVisible(false);
      // 重新获取
      if (songInfo) handleSongSelect({ id: songInfo.id, name: songInfo.name });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "更新失败");
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
      setDeleteDialogVisible(false);
      setSongInfo(null);
      setEditForm(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "删除失败");
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
    const ids = (editForm?.[`${type}_ids` as keyof EditForm] as number[]) || [];
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
        <EntitySearch
          type={type}
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
          {/* 歌曲选择 */}
          <div className="space-y-2">
            <Label>选择歌曲</Label>
            <EntitySearch
              type="song"
              value={songInfo ? { id: songInfo.id, name: songInfo.name } : null}
              onChange={handleSongSelect}
            />
          </div>

          {/* 编辑区 */}
          {editForm && songInfo && (
            <>
              <div className="border-t pt-5 space-y-5">
                <div className="space-y-2">
                  <Label>歌曲名称</Label>
                  <Input value={songInfo.name} disabled />
                </div>

                <div className="space-y-2">
                  <Label>显示名称</Label>
                  <Input
                    value={editForm.display_name}
                    placeholder="留空则使用歌曲名称"
                    onChange={(e) =>
                      setEditForm({ ...editForm, display_name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>类型</Label>
                  <Select
                    value={editForm.type}
                    onValueChange={(val: SongType) =>
                      setEditForm({ ...editForm, type: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {songTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
                    onClick={handleSubmit}
                    disabled={submitting || !hasChanges}
                  >
                    {hasChanges ? "提交更新" : "无变化"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setDeleteDialogVisible(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 确认编辑 */}
      <Dialog open={dialogVisible} onOpenChange={setDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认更新歌曲信息</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm">
            确定要更新歌曲 "{songInfo?.name}" 的信息吗？
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogVisible(false)}>
              取消
            </Button>
            <Button onClick={confirmEdit} disabled={submitting}>
              {submitting ? "更新中..." : "确认更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 确认删除 */}
      <Dialog open={deleteDialogVisible} onOpenChange={setDeleteDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除歌曲</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-destructive">
            确定要删除歌曲 "{songInfo?.name}" 吗？
            此操作会删除所有关联视频和快照，且不可恢复！
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogVisible(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
