// src/components/EditPanels/MergeArtist.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import api from "@/utils/api";
import EntitySearch from "./EntitySearch";

const artistTypes = [
  { label: "歌手", value: "vocalist" },
  { label: "作者", value: "producer" },
  { label: "引擎", value: "synthesizer" },
] as const;

type ArtistType = (typeof artistTypes)[number]["value"];

interface SelectedEntity {
  id: number;
  name: string;
}

export default function MergeArtist() {
  const [artistType, setArtistType] = useState<ArtistType>("vocalist");
  const [source, setSource] = useState<SelectedEntity | null>(null);
  const [target, setTarget] = useState<SelectedEntity | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);

  const handleTypeChange = (type: ArtistType) => {
    setArtistType(type);
    setSource(null);
    setTarget(null);
  };

  const handleMerge = () => {
    if (!source || !target) {
      toast.warning("请选择源艺人和目标艺人");
      return;
    }
    if (source.id === target.id) {
      toast.warning("源艺人和目标艺人不能相同");
      return;
    }
    setDialogVisible(true);
  };

  const confirmMerge = async () => {
    if (!source || !target) return;
    try {
      setLoading(true);
      const result = await api.mergeArtist(artistType, source.id, target.id);
      toast.success(`艺人合并成功，影响 ${result.songs_affected || 0} 首歌曲`);
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

  const getTypeLabel = (type: string) =>
    artistTypes.find((t) => t.value === type)?.label || type;

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

          <div className="space-y-2">
            <Label>艺人类型</Label>
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
            <div className="space-y-2">
              <Label>源{getTypeLabel(artistType)}（被删除）</Label>
              <EntitySearch
                type={artistType}
                value={source}
                onChange={setSource}
              />
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground mb-2" />

            <div className="space-y-2">
              <Label>目标{getTypeLabel(artistType)}（保留）</Label>
              <EntitySearch
                type={artistType}
                value={target}
                onChange={setTarget}
              />
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleMerge}
            disabled={!source || !target}
          >
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
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded">
              源艺人的所有歌曲关联将转移到目标艺人，然后删除源艺人。
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
