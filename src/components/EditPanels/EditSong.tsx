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
import type { SongInfo, SongType, Artist } from "@/utils/types";

const songTypes: SongType[] = ["原创", "翻唱", "本家重置", "串烧"];

interface EditForm {
  id: number;
  display_name: string;
  type: SongType;
  vocadb_id: number | null;
  vocalist_ids: number[];
  producer_ids: number[];
  synthesizer_ids: number[];
}

export default function EditSong() {
  const [searchId, setSearchId] = useState<number | "">("");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [songInfo, setSongInfo] = useState<SongInfo | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // 艺术家搜索
  const [artistSearch, setArtistSearch] = useState({ type: "", query: "" });
  const [artistResults, setArtistResults] = useState<Artist[]>([]);

  const hasChanges = useMemo(() => {
    if (!songInfo || !editForm) return false;
    const original = {
      display_name: songInfo.display_name || "",
      type: songInfo.type,
      vocadb_id: songInfo.vocadb_id || null,
      vocalist_ids: (songInfo.vocalists || []).map((a) => a.id).sort(),
      producer_ids: (songInfo.producers || []).map((a) => a.id).sort(),
      synthesizer_ids: (songInfo.synthesizers || []).map((a) => a.id).sort(),
    };
    const current = {
      display_name: editForm.display_name,
      type: editForm.type,
      vocadb_id: editForm.vocadb_id,
      vocalist_ids: [...editForm.vocalist_ids].sort(),
      producer_ids: [...editForm.producer_ids].sort(),
      synthesizer_ids: [...editForm.synthesizer_ids].sort(),
    };
    return JSON.stringify(original) !== JSON.stringify(current);
  }, [songInfo, editForm]);

  const handleSearch = async () => {
    if (!searchId) {
      toast.warning("请输入歌曲ID");
      return;
    }
    try {
      setSearching(true);
      const result = await api.selectSong(Number(searchId));
      const data = result.data;
      setSongInfo(data);
      setEditForm({
        id: data.id,
        display_name: data.display_name || "",
        type: data.type,
        vocadb_id: data.vocadb_id || null,
        vocalist_ids: (data.vocalists || []).map((a) => a.id),
        producer_ids: (data.producers || []).map((a) => a.id),
        synthesizer_ids: (data.synthesizers || []).map((a) => a.id),
      });
      toast.success("歌曲信息获取成功");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "获取歌曲信息失败");
      setSongInfo(null);
      setEditForm(null);
    } finally {
      setSearching(false);
    }
  };

  const searchArtist = async (type: string) => {
    if (!artistSearch.query.trim()) return;
    try {
      const result = await api.search(type, artistSearch.query, 1, 10);
      setArtistResults(result.data || []);
      setArtistSearch({ ...artistSearch, type });
    } catch {
      setArtistResults([]);
    }
  };

  const addArtist = (
    type: "vocalist" | "producer" | "synthesizer",
    artist: Artist,
  ) => {
    if (!editForm) return;
    const key = `${type}_ids` as keyof EditForm;
    const ids = editForm[key] as number[];
    if (!ids.includes(artist.id)) {
      setEditForm({ ...editForm, [key]: [...ids, artist.id] });
    }
    setArtistResults([]);
    setArtistSearch({ type: "", query: "" });
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
        vocadb_id: editForm.vocadb_id,
        vocalist_ids: editForm.vocalist_ids,
        producer_ids: editForm.producer_ids,
        synthesizer_ids: editForm.synthesizer_ids,
      });
      toast.success("歌曲信息更新成功");
      setDialogVisible(false);
      // 刷新
      handleSearch();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "更新失败");
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
      setSearchId("");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "删除失败");
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
      <div>
        <Label className="mb-2 block">{label}：</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {ids.map((id) => (
            <Badge key={id} variant="secondary" className="gap-1">
              {getArtistName(type, id)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeArtist(type, id)}
              />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder={`搜索${label}`}
            value={artistSearch.type === type ? artistSearch.query : ""}
            onChange={(e) => setArtistSearch({ type, query: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && searchArtist(type)}
            className="flex-1"
          />
          <Button size="sm" onClick={() => searchArtist(type)}>
            搜索
          </Button>
        </div>
        {artistSearch.type === type && artistResults.length > 0 && (
          <div className="mt-2 border rounded-md p-2 max-h-32 overflow-y-auto">
            {artistResults.map((a) => (
              <div
                key={a.id}
                className="p-1 hover:bg-muted cursor-pointer rounded"
                onClick={() => addArtist(type, a)}
              >
                {a.name} (ID: {a.id})
              </div>
            ))}
          </div>
        )}
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
        <CardContent>
          {/* 搜索 */}
          <div className="mb-6">
            <Label className="mb-2 block">歌曲ID：</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="请输入歌曲ID"
                value={searchId}
                onChange={(e) =>
                  setSearchId(e.target.value ? parseInt(e.target.value) : "")
                }
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={searching || !searchId}>
                {searching ? "搜索中..." : "搜索"}
              </Button>
            </div>
          </div>

          {/* 编辑区 */}
          {editForm && songInfo && (
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">歌曲名称：</Label>
                <Input value={songInfo.name} disabled />
              </div>

              <div>
                <Label className="mb-2 block">显示名称：</Label>
                <Input
                  value={editForm.display_name}
                  placeholder="请输入显示名称"
                  onChange={(e) =>
                    setEditForm({ ...editForm, display_name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-2 block">类型：</Label>
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

              <div>
                <Label className="mb-2 block">VocaDB ID：</Label>
                <Input
                  type="number"
                  value={editForm.vocadb_id || ""}
                  placeholder="请输入VocaDB ID"
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      vocadb_id: parseInt(e.target.value) || null,
                    })
                  }
                />
              </div>

              <ArtistSection label="歌手" type="vocalist" />
              <ArtistSection label="作者" type="producer" />
              <ArtistSection label="引擎" type="synthesizer" />

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  提交更新
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogVisible(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 确认编辑对话框 */}
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

      {/* 确认删除对话框 */}
      <Dialog open={deleteDialogVisible} onOpenChange={setDeleteDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除歌曲</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-destructive">
            确定要删除歌曲 "{songInfo?.name}"
            吗？此操作会删除所有关联视频和快照，且不可恢复！
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
