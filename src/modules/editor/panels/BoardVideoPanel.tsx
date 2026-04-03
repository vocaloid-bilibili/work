// src/modules/editor/panels/BoardVideoPanel.tsx
import { useState } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Card, CardContent } from "@/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import { BOARDS } from "@/core/types/constants";

export default function BoardVideoPanel() {
  const [board, setBoard] = useState("vocaloid-daily");
  const [issue, setIssue] = useState("");
  const [cur, setCur] = useState<string | null>(null);
  const [bvid, setBvid] = useState("");
  const [querying, setQuerying] = useState(false);
  const [saving, setSaving] = useState(false);

  const query = async () => {
    const n = parseInt(issue);
    if (!n || n < 1) {
      toast.warning("请输入有效期数");
      return;
    }
    setQuerying(true);
    try {
      const r = await api.getBoardVideo(board, n);
      setCur(r?.bvid ?? "");
      setBvid(r?.bvid ?? "");
    } catch {
      setCur("");
      setBvid("");
    } finally {
      setQuerying(false);
    }
  };

  const save = async () => {
    const n = parseInt(issue);
    if (!n || !bvid.trim()) return;
    setSaving(true);
    try {
      await api.setBoardVideo(board, n, bvid.trim());
      logEdit({
        targetType: "ranking_video",
        targetId: `${board}_${n}`,
        action: "set_board_video",
        detail: { board, issue: n, oldBvid: cur, newBvid: bvid.trim() },
      });
      toast.success("榜单视频设置成功");
      setCur(bvid.trim());
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "设置失败");
    } finally {
      setSaving(false);
    }
  };

  const changed = bvid.trim() !== (cur ?? "");

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground text-center">
        设置榜单期对应的B站投稿视频
      </p>
      <Card>
        <CardContent className="pt-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">榜单</Label>
              <Select value={board} onValueChange={setBoard}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOARDS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">期数</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="期数"
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && query()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={query}
                  disabled={querying}
                >
                  {querying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "查询"
                  )}
                </Button>
              </div>
            </div>
          </div>
          {cur !== null && (
            <div className="space-y-3 border-t pt-4">
              <div className="text-sm text-muted-foreground">
                当前: <span className="font-mono">{cur || "（未设置）"}</span>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">BV号</Label>
                <Input
                  value={bvid}
                  onChange={(e) => setBvid(e.target.value)}
                  placeholder="输入BV号"
                />
              </div>
              <Button
                className="w-full"
                onClick={save}
                disabled={saving || !changed || !bvid.trim()}
              >
                {changed ? "保存" : "无变化"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
