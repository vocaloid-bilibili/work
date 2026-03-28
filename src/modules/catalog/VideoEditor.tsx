// src/modules/catalog/VideoEditor.tsx
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
import { Switch } from "@/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import type { Video, Copyright } from "@/core/types/catalog";
import { COPYRIGHT_MAP } from "@/core/types/catalog";

const COPYRIGHT_OPTIONS = [
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

export default function VideoEditor() {
  const [searchBvid, setSearchBvid] = useState("");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [videoInfo, setVideoInfo] = useState<Video | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const hasChanges = useMemo(() => {
    if (!videoInfo || !form) return false;
    return (
      form.title !== videoInfo.title ||
      form.copyright !== videoInfo.copyright ||
      form.uploader_id !== videoInfo.uploader_id ||
      form.disabled !== (videoInfo.disabled || false)
    );
  }, [videoInfo, form]);

  const handleSearch = async () => {
    if (!searchBvid.trim()) {
      toast.warning("请输入视频BV号");
      return;
    }
    try {
      setSearching(true);
      const result = await api.selectVideo(searchBvid.trim());
      const d = result.data;
      setVideoInfo(d);
      setForm({
        bvid: d.bvid,
        title: d.title,
        copyright: d.copyright,
        uploader_id: d.uploader_id,
        disabled: d.disabled || false,
      });
      toast.success("视频信息获取成功");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "获取视频信息失败");
      setVideoInfo(null);
      setForm(null);
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setVideoInfo(null);
    setForm(null);
    setSearchBvid("");
  };

  const confirmEdit = async () => {
    if (!form) return;
    try {
      setSubmitting(true);
      await api.editVideo({
        bvid: form.bvid,
        title: form.title,
        copyright: form.copyright,
        uploader_id: form.uploader_id,
        disabled: form.disabled,
      });
      toast.success("视频信息更新成功");
      setConfirmOpen(false);
      handleSearch();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "更新失败");
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
      setDeleteOpen(false);
      handleClear();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "删除失败");
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
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>视频BV号</Label>
            {videoInfo ? (
              <div
                className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50 cursor-pointer hover:bg-muted"
                onClick={handleClear}
              >
                <span className="font-medium flex-1 truncate">
                  {videoInfo.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {videoInfo.bvid}
                </span>
                <span className="text-xs text-muted-foreground">点击清除</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="输入BV号"
                    value={searchBvid}
                    onChange={(e) => setSearchBvid(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    disabled={searching}
                  />
                  {searching && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={searching || !searchBvid.trim()}
                >
                  查询
                </Button>
              </div>
            )}
          </div>

          {form && (
            <div className="border-t pt-5 space-y-5">
              <div className="space-y-2">
                <Label>视频标题</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>版权类型</Label>
                <Select
                  value={String(form.copyright)}
                  onValueChange={(val) =>
                    setForm({ ...form, copyright: parseInt(val) as Copyright })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COPYRIGHT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>投稿人ID</Label>
                <Input
                  type="number"
                  value={form.uploader_id || ""}
                  placeholder="可选"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      uploader_id: parseInt(e.target.value) || undefined,
                    })
                  }
                />
                {videoInfo?.uploader_name && (
                  <div className="text-sm text-muted-foreground">
                    当前投稿人：{videoInfo.uploader_name}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label>禁用视频</Label>
                <Switch
                  checked={form.disabled}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, disabled: checked })
                  }
                />
              </div>

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
        title="确认更新视频信息"
        loading={submitting}
        onConfirm={confirmEdit}
        confirm="确认更新"
      >
        <div className="space-y-2 text-sm">
          {form?.title !== videoInfo?.title && (
            <div className="flex gap-2">
              <span className="text-muted-foreground">标题:</span>
              <span className="line-through text-muted-foreground">
                {videoInfo?.title}
              </span>
              <span>→</span>
              <span>{form?.title}</span>
            </div>
          )}
          {form?.copyright !== videoInfo?.copyright && (
            <div className="flex gap-2">
              <span className="text-muted-foreground">版权:</span>
              <span>
                {COPYRIGHT_MAP[videoInfo?.copyright as Copyright] || "未知"}
              </span>
              <span>→</span>
              <span>
                {COPYRIGHT_MAP[form?.copyright as Copyright] || "未知"}
              </span>
            </div>
          )}
          {form?.disabled !== (videoInfo?.disabled || false) && (
            <div className="flex gap-2">
              <span className="text-muted-foreground">禁用:</span>
              <span>{videoInfo?.disabled ? "是" : "否"}</span>
              <span>→</span>
              <span>{form?.disabled ? "是" : "否"}</span>
            </div>
          )}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="确认删除视频"
        variant="destructive"
        loading={deleting}
        onConfirm={confirmDelete}
        confirm="确认删除"
      >
        <p className="text-sm text-destructive">
          确定要删除视频 {videoInfo?.bvid}{" "}
          吗？此操作会删除所有快照，且不可恢复！
        </p>
      </ConfirmDialog>
    </div>
  );
}
