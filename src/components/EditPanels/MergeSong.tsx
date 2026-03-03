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
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import api from "@/utils/api";
import type { SongInfo } from "@/utils/types";

export default function MergeSong() {
  const [sourceId, setSourceId] = useState<number | "">("");
  const [targetId, setTargetId] = useState<number | "">("");
  const [sourceSong, setSourceSong] = useState<SongInfo | null>(null);
  const [targetSong, setTargetSong] = useState<SongInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);

  const fetchSong = async (id: number, setFn: (s: SongInfo | null) => void) => {
    try {
      const result = await api.selectSong(id);
      setFn(result.data);
    } catch {
      setFn(null);
      toast.error(`获取歌曲 ${id} 失败`);
    }
  };

  const handleMerge = () => {
    if (!sourceId || !targetId) {
      toast.warning("请填写完整信息");
      return;
    }
    if (sourceId === targetId) {
      toast.warning("源歌曲和目标歌曲不能相同");
      return;
    }
    if (!sourceSong || !targetSong) {
      toast.warning("请先查询歌曲信息");
      return;
    }
    setDialogVisible(true);
  };

  const confirmMerge = async () => {
    if (!sourceId || !targetId) return;
    try {
      setLoading(true);
      await api.mergeSong(Number(sourceId), Number(targetId));
      toast.success("歌曲合并成功");
      setDialogVisible(false);
      setSourceId("");
      setTargetId("");
      setSourceSong(null);
      setTargetSong(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "合并失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">
            合并歌曲
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground text-center">
            将源歌曲的视频移到目标歌曲，然后删除源歌曲（历史排名保留为孤儿数据）
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
            {/* 源歌曲 */}
            <div className="space-y-2">
              <Label>源歌曲ID（被删除）：</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={sourceId}
                  onChange={(e) =>
                    setSourceId(e.target.value ? parseInt(e.target.value) : "")
                  }
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    sourceId && fetchSong(Number(sourceId), setSourceSong)
                  }
                >
                  查询
                </Button>
              </div>
              {sourceSong && (
                <div className="p-2 bg-destructive/10 rounded text-sm">
                  <div className="font-medium">{sourceSong.name}</div>
                  <div className="text-muted-foreground">
                    ID: {sourceSong.id}
                  </div>
                </div>
              )}
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground mb-8" />

            {/* 目标歌曲 */}
            <div className="space-y-2">
              <Label>目标歌曲ID（保留）：</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={targetId}
                  onChange={(e) =>
                    setTargetId(e.target.value ? parseInt(e.target.value) : "")
                  }
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    targetId && fetchSong(Number(targetId), setTargetSong)
                  }
                >
                  查询
                </Button>
              </div>
              {targetSong && (
                <div className="p-2 bg-primary/10 rounded text-sm">
                  <div className="font-medium">{targetSong.name}</div>
                  <div className="text-muted-foreground">
                    ID: {targetSong.id}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button className="w-full" onClick={handleMerge}>
            合并歌曲
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogVisible} onOpenChange={setDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认合并歌曲</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <div className="text-destructive">
              删除：{sourceSong?.name} (ID: {sourceSong?.id})
            </div>
            <div className="text-primary">
              保留：{targetSong?.name} (ID: {targetSong?.id})
            </div>
            <div className="text-sm text-muted-foreground mt-4">
              源歌曲的视频将移动到目标歌曲，艺术家关联将合并，历史排名不变动。
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogVisible(false)}>
              取消
            </Button>
            <Button onClick={confirmMerge} disabled={loading}>
              {loading ? "合并中..." : "确认合并"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
