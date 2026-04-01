// src/modules/editor/dialogs/BoardVideoDialog.tsx
import { useState } from "react";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Button } from "@/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";

const BOARDS = [
  { value: "vocaloid-daily", label: "日刊" },
  { value: "vocaloid-weekly", label: "周刊" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function BoardVideoDialog({ open, onOpenChange }: Props) {
  const [board, setBoard] = useState("vocaloid-daily");
  const [issue, setIssue] = useState("");
  const [currentBvid, setCurrentBvid] = useState<string | null>(null);
  const [newBvid, setNewBvid] = useState("");
  const [querying, setQuerying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleQuery = async () => {
    const n = parseInt(issue);
    if (!n || n < 1) {
      toast.warning("请输入有效期数");
      return;
    }
    try {
      setQuerying(true);
      const r = await api.getBoardVideo(board, n);
      setCurrentBvid(r?.bvid ?? null);
      setNewBvid(r?.bvid ?? "");
    } catch {
      setCurrentBvid(null);
      setNewBvid("");
      toast.error("查询失败");
    } finally {
      setQuerying(false);
    }
  };

  const handleSubmit = async () => {
    const n = parseInt(issue);
    if (!n || !newBvid.trim()) return;
    try {
      setSubmitting(true);
      await api.setBoardVideo(board, n, newBvid.trim());
      logEdit({
        targetType: "ranking_video",
        targetId: `${board}_${n}`,
        action: "set_board_video",
        detail: {
          board,
          issue: n,
          oldBvid: currentBvid,
          newBvid: newBvid.trim(),
        },
      });
      toast.success("榜单视频设置成功");
      setCurrentBvid(newBvid.trim());
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "设置失败");
    } finally {
      setSubmitting(false);
    }
  };

  const changed = newBvid.trim() !== (currentBvid ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>榜单视频</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
                  onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuery}
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

          {currentBvid !== null && (
            <div className="space-y-3 border-t pt-3">
              <div className="text-sm text-muted-foreground">
                当前:{" "}
                <span className="font-mono">{currentBvid || "（未设置）"}</span>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">BV号</Label>
                <Input
                  value={newBvid}
                  onChange={(e) => setNewBvid(e.target.value)}
                  placeholder="输入BV号"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={submitting || !changed || !newBvid.trim()}
              >
                {changed ? "保存" : "无变化"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
