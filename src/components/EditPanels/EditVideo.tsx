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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/utils/api";
import type { VideoInfo, Copyright } from "@/utils/types";

const copyrightOptions = [
  { label: "自制", value: 1 },
  { label: "转载", value: 2 },
  { label: "未定", value: 3 },
  { label: "转载投自制", value: 101 },
  { label: "自制投转载", value: 100 },
];

interface EditForm {
  bvid: string;
  title: string;
  copyright: Copyright;
  uploader_id?: number;
  disabled: boolean;
}

export default function EditVideo() {
  const [searchBvid, setSearchBvid] = useState("");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const hasChanges = useMemo(() => {
    if (!videoInfo || !editForm) return false;
    return (
      editForm.title !== videoInfo.title ||
      editForm.copyright !== videoInfo.copyright ||
      editForm.uploader_id !== videoInfo.uploader_id ||
      editForm.disabled !== (videoInfo.disabled || false)
    );
  }, [videoInfo, editForm]);

  const getCopyrightLabel = (copyright?: Copyright) => {
    return (
      copyrightOptions.find((opt) => opt.value === copyright)?.label || "未知"
    );
  };

  const handleSearch = async () => {
    if (!searchBvid.trim()) {
      toast.warning("请输入视频BV号");
      return;
    }
    try {
      setSearching(true);
      const result = await api.selectVideo(searchBvid);
      const data = result.data;
      setVideoInfo(data);
      setEditForm({
        bvid: data.bvid,
        title: data.title,
        copyright: data.copyright,
        uploader_id: data.uploader_id,
        disabled: data.disabled || false,
      });
      toast.success("视频信息获取成功");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "获取视频信息失败");
      setVideoInfo(null);
      setEditForm(null);
    } finally {
      setSearching(false);
    }
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
      await api.editVideo({
        bvid: editForm.bvid,
        title: editForm.title,
        copyright: editForm.copyright,
        uploader_id: editForm.uploader_id,
        disabled: editForm.disabled,
      });
      toast.success("视频信息更新成功");
      setDialogVisible(false);
      handleSearch();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "更新失败");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!videoInfo) return;
    try {
      setDeleting(true);
      await api.deleteVideo(videoInfo.bvid);
      toast.success("视频删除成功");
      setDeleteDialogVisible(false);
      setVideoInfo(null);
      setEditForm(null);
      setSearchBvid("");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "删除失败");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">
            编辑视频信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label className="mb-2 block">视频BV号：</Label>
            <div className="flex gap-2">
              <Input
                placeholder="请输入视频BV号"
                value={searchBvid}
                onChange={(e) => setSearchBvid(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={searching || !searchBvid.trim()}
              >
                {searching ? "搜索中..." : "搜索"}
              </Button>
            </div>
          </div>

          {editForm && (
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">BV号：</Label>
                <Input value={editForm.bvid} disabled />
              </div>

              <div>
                <Label className="mb-2 block">视频标题：</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-2 block">版权类型：</Label>
                <Select
                  value={String(editForm.copyright)}
                  onValueChange={(val) =>
                    setEditForm({
                      ...editForm,
                      copyright: parseInt(val) as Copyright,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {copyrightOptions.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">投稿人ID：</Label>
                <Input
                  type="number"
                  value={editForm.uploader_id || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      uploader_id: parseInt(e.target.value) || undefined,
                    })
                  }
                />
                {videoInfo?.uploader_name && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    当前投稿人：{videoInfo.uploader_name}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Label>禁用：</Label>
                <Switch
                  checked={editForm.disabled}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, disabled: checked })
                  }
                />
              </div>

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

      <Dialog open={dialogVisible} onOpenChange={setDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认更新视频信息</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2 text-sm">
            {editForm?.title !== videoInfo?.title && (
              <div>
                标题：{videoInfo?.title} → {editForm?.title}
              </div>
            )}
            {editForm?.copyright !== videoInfo?.copyright && (
              <div>
                版权：{getCopyrightLabel(videoInfo?.copyright)} →{" "}
                {getCopyrightLabel(editForm?.copyright)}
              </div>
            )}
            {editForm?.disabled !== (videoInfo?.disabled || false) && (
              <div>
                禁用：{videoInfo?.disabled ? "是" : "否"} →{" "}
                {editForm?.disabled ? "是" : "否"}
              </div>
            )}
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

      <Dialog open={deleteDialogVisible} onOpenChange={setDeleteDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除视频</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-destructive">
            确定要删除视频 {videoInfo?.bvid}{" "}
            吗？此操作会删除所有快照，且不可恢复！
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
