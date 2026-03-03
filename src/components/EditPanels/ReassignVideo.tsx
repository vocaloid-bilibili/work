// src/components/EditPanels/ReassignVideo.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/utils/api";
import EntitySearch from "./EntitySearch";
import type { VideoInfo } from "@/utils/types";

export default function ReassignVideo() {
  const [bvid, setBvid] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [targetSong, setTargetSong] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [newSongName, setNewSongName] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);

  const fetchVideo = async () => {
    if (!bvid.trim()) {
      toast.warning("请输入BV号");
      return;
    }
    try {
      const result = await api.selectVideo(bvid);
      setVideoInfo(result.data);
      toast.success("视频信息获取成功");
    } catch {
      setVideoInfo(null);
      toast.error("获取视频信息失败");
    }
  };

  const handleReassign = () => {
    if (!videoInfo) {
      toast.warning("请先查询视频");
      return;
    }
    if (mode === "existing" && !targetSong) {
      toast.warning("请选择目标歌曲");
      return;
    }
    if (mode === "new" && !newSongName.trim()) {
      toast.warning("请输入新歌曲名称");
      return;
    }
    setDialogVisible(true);
  };

  const confirmReassign = async () => {
    if (!videoInfo) return;
    try {
      setLoading(true);
      await api.reassignVideo(
        videoInfo.bvid,
        mode === "existing" ? targetSong?.id : undefined,
        mode === "new" ? newSongName : undefined,
      );
      toast.success("视频移动成功");
      setDialogVisible(false);
      setBvid("");
      setVideoInfo(null);
      setTargetSong(null);
      setNewSongName("");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "移动失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">
            拆分/移动视频
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground text-center">
            将视频移动到另一首歌曲（历史排名不变动）
          </div>

          {/* 视频查询 */}
          <div className="space-y-2">
            <Label>视频BV号</Label>
            <div className="flex gap-2">
              <Input
                placeholder="输入BV号"
                value={bvid}
                onChange={(e) => setBvid(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchVideo()}
              />
              <Button variant="outline" onClick={fetchVideo}>
                查询
              </Button>
            </div>
            {videoInfo && (
              <div className="p-3 bg-muted rounded text-sm">
                <div className="font-medium">{videoInfo.title}</div>
                <div className="text-muted-foreground">
                  当前歌曲ID: {videoInfo.song_id}
                </div>
              </div>
            )}
          </div>

          {/* 目标选择 */}
          {videoInfo && (
            <>
              <div className="space-y-2">
                <Label>目标类型</Label>
                <Select
                  value={mode}
                  onValueChange={(v: "existing" | "new") => {
                    setMode(v);
                    setTargetSong(null);
                    setNewSongName("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="existing">移到已有歌曲</SelectItem>
                    <SelectItem value="new">创建新歌曲</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {mode === "existing" && (
                <div className="space-y-2">
                  <Label>目标歌曲</Label>
                  <EntitySearch
                    type="song"
                    value={targetSong}
                    onChange={setTargetSong}
                    placeholder="搜索目标歌曲"
                  />
                </div>
              )}

              {mode === "new" && (
                <div className="space-y-2">
                  <Label>新歌曲名称</Label>
                  <Input
                    placeholder="输入新歌曲名称"
                    value={newSongName}
                    onChange={(e) => setNewSongName(e.target.value)}
                  />
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleReassign}
                disabled={
                  (mode === "existing" && !targetSong) ||
                  (mode === "new" && !newSongName.trim())
                }
              >
                移动视频
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogVisible} onOpenChange={setDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认移动视频</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="p-3 bg-muted rounded">
              <div className="text-sm text-muted-foreground">视频</div>
              <div className="font-medium">{videoInfo?.title}</div>
              <div className="text-xs text-muted-foreground">
                {videoInfo?.bvid}
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded">
              <div className="text-sm text-muted-foreground">目标</div>
              <div className="font-medium">
                {mode === "existing"
                  ? targetSong?.name
                  : `新歌曲: ${newSongName}`}
              </div>
              {mode === "existing" && targetSong && (
                <div className="text-xs text-muted-foreground">
                  ID: {targetSong.id}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogVisible(false)}>
              取消
            </Button>
            <Button onClick={confirmReassign} disabled={loading}>
              {loading ? "移动中..." : "确认移动"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
