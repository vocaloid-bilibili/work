// src/components/EditPanels/MergeArtist.tsx
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
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import api from "@/utils/api";
import type { Artist } from "@/utils/types";

const artistTypes = [
  { label: "歌手", value: "vocalist" },
  { label: "作者", value: "producer" },
  { label: "引擎", value: "synthesizer" },
];

export default function MergeArtist() {
  const [artistType, setArtistType] = useState("vocalist");
  const [sourceId, setSourceId] = useState<number | "">("");
  const [targetId, setTargetId] = useState<number | "">("");
  const [sourceArtist, setSourceArtist] = useState<Artist | null>(null);
  const [targetArtist, setTargetArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);

  const fetchArtist = async (id: number, setFn: (a: Artist | null) => void) => {
    try {
      const result = await api.selectArtist(artistType, id);
      const data = result.data || result;
      setFn(data);
      toast.success(`找到: ${data.name}`);
    } catch (error: unknown) {
      setFn(null);
      const err = error as { response?: { data?: { detail?: string } } };
      const detail = err.response?.data?.detail;
      if (detail?.includes("not found")) {
        toast.error(`艺人 ${id} 不存在`);
      } else {
        toast.error(detail || `获取艺人 ${id} 失败`);
      }
    }
  };

  const handleTypeChange = (type: string) => {
    setArtistType(type);
    // 切换类型时清空已查询的艺人
    setSourceArtist(null);
    setTargetArtist(null);
  };

  const handleMerge = () => {
    if (!sourceId || !targetId) {
      toast.warning("请填写完整信息");
      return;
    }
    if (sourceId === targetId) {
      toast.warning("源艺人和目标艺人不能相同");
      return;
    }
    if (!sourceArtist || !targetArtist) {
      toast.warning("请先查询艺人信息");
      return;
    }
    setDialogVisible(true);
  };

  const confirmMerge = async () => {
    if (!sourceId || !targetId) return;
    try {
      setLoading(true);
      const result = await api.mergeArtist(
        artistType,
        Number(sourceId),
        Number(targetId),
      );
      toast.success(`艺人合并成功，影响 ${result.songs_affected || 0} 首歌曲`);
      setDialogVisible(false);
      setSourceId("");
      setTargetId("");
      setSourceArtist(null);
      setTargetArtist(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "合并失败");
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    return artistTypes.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">
            合并艺人
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground text-center">
            将源艺人的所有歌曲关联转移到目标艺人，然后删除源艺人
          </div>

          {/* 艺人类型 */}
          <div className="space-y-2">
            <Label>艺人类型：</Label>
            <Select value={artistType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {artistTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
            {/* 源艺人 */}
            <div className="space-y-2">
              <Label>源艺人ID（被删除）：</Label>
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
                    sourceId && fetchArtist(Number(sourceId), setSourceArtist)
                  }
                >
                  查询
                </Button>
              </div>
              {sourceArtist && (
                <div className="p-3 bg-destructive/10 rounded text-sm space-y-1">
                  <div className="font-medium">{sourceArtist.name}</div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">ID: {sourceArtist.id}</Badge>
                  </div>
                </div>
              )}
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground mb-8" />

            {/* 目标艺人 */}
            <div className="space-y-2">
              <Label>目标艺人ID（保留）：</Label>
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
                    targetId && fetchArtist(Number(targetId), setTargetArtist)
                  }
                >
                  查询
                </Button>
              </div>
              {targetArtist && (
                <div className="p-3 bg-primary/10 rounded text-sm space-y-1">
                  <div className="font-medium">{targetArtist.name}</div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">ID: {targetArtist.id}</Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button className="w-full" onClick={handleMerge}>
            合并艺人
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogVisible} onOpenChange={setDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认合并{getTypeLabel(artistType)}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-2 text-destructive">
              <span>删除：</span>
              <span className="font-medium">{sourceArtist?.name}</span>
              <Badge variant="outline">ID: {sourceArtist?.id}</Badge>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <span>保留：</span>
              <span className="font-medium">{targetArtist?.name}</span>
              <Badge variant="outline">ID: {targetArtist?.id}</Badge>
            </div>
            <div className="text-sm text-muted-foreground mt-4 p-3 bg-muted rounded">
              <p>合并后将执行以下操作：</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>源艺人的所有歌曲关联将转移到目标艺人</li>
                <li>重复的关联将被自动去重</li>
                <li>源艺人将被永久删除</li>
              </ul>
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
