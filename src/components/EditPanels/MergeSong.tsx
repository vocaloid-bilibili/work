// src/components/EditPanels/MergeSong.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import EntitySearch from "./EntitySearch";

interface SelectedEntity {
  id: number;
  name: string;
}

export default function MergeSong() {
  const [source, setSource] = useState<SelectedEntity | null>(null);
  const [target, setTarget] = useState<SelectedEntity | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);

  const handleMerge = () => {
    if (!source || !target) {
      toast.warning("请选择源歌曲和目标歌曲");
      return;
    }
    if (source.id === target.id) {
      toast.warning("源歌曲和目标歌曲不能相同");
      return;
    }
    setDialogVisible(true);
  };

  const confirmMerge = async () => {
    if (!source || !target) return;
    try {
      setLoading(true);
      await api.mergeSong(source.id, target.id);
      toast.success("歌曲合并成功");
      setDialogVisible(false);
      setSource(null);
      setTarget(null);
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
            将源歌曲的视频移到目标歌曲，然后删除源歌曲
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <div className="space-y-2">
              <Label>源歌曲（被删除）</Label>
              <EntitySearch
                type="song"
                value={source}
                onChange={setSource}
                placeholder="搜索要删除的歌曲"
              />
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground mb-2" />

            <div className="space-y-2">
              <Label>目标歌曲（保留）</Label>
              <EntitySearch
                type="song"
                value={target}
                onChange={setTarget}
                placeholder="搜索目标歌曲"
              />
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleMerge}
            disabled={!source || !target}
          >
            合并歌曲
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogVisible} onOpenChange={setDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认合并歌曲</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="p-3 bg-destructive/10 rounded">
              <div className="text-sm text-muted-foreground">删除</div>
              <div className="font-medium">{source?.name}</div>
              <div className="text-xs text-muted-foreground">
                ID: {source?.id}
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded">
              <div className="text-sm text-muted-foreground">保留</div>
              <div className="font-medium">{target?.name}</div>
              <div className="text-xs text-muted-foreground">
                ID: {target?.id}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogVisible(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmMerge}
              disabled={loading}
            >
              {loading ? "合并中..." : "确认合并"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
