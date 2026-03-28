// src/modules/catalog/BoardVideoEditor.tsx

import { useState, useCallback } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { getBoardVideo, setBoardVideo } from "@/core/api/mainEndpoints";

const BOARDS = [
  { value: "vocaloid-daily", label: "日刊" },
  { value: "vocaloid-weekly", label: "周刊" },
  { value: "vocaloid-monthly", label: "月刊" },
] as const;

export default function BoardVideoEditor() {
  const [board, setBoard] = useState("vocaloid-daily");
  const [issue, setIssue] = useState("");
  const [bvid, setBvid] = useState("");
  const [loading, setLoading] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [queried, setQueried] = useState(false);
  const [currentBvid, setCurrentBvid] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const resetState = () => {
    setQueried(false);
    setCurrentBvid(null);
    setBvid("");
    setMessage(null);
  };

  const handleQuery = useCallback(async () => {
    const issueNum = Number(issue);
    if (!issueNum || issueNum < 1) {
      setMessage({ type: "err", text: "请输入有效的期号" });
      return;
    }
    setQuerying(true);
    setMessage(null);
    try {
      const result = await getBoardVideo(board, issueNum);
      setQueried(true);
      if (result?.bvid) {
        setCurrentBvid(result.bvid);
        setBvid(result.bvid);
      } else {
        setCurrentBvid(null);
        setBvid("");
      }
    } catch (e: any) {
      setMessage({
        type: "err",
        text: e?.response?.data?.detail || e.message || "查询失败",
      });
    } finally {
      setQuerying(false);
    }
  }, [board, issue]);

  const handleSubmit = useCallback(async () => {
    const issueNum = Number(issue);
    if (!issueNum || issueNum < 1) {
      setMessage({ type: "err", text: "请输入有效的期号" });
      return;
    }
    const trimmed = bvid.trim();
    if (!trimmed) {
      setMessage({ type: "err", text: "请输入 BV 号" });
      return;
    }
    if (!/^BV[\w]{10}$/i.test(trimmed)) {
      setMessage({ type: "err", text: "BV 号格式不正确，应为 BV + 10位字符" });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await setBoardVideo(board, issueNum, trimmed);
      const oldBvid = currentBvid;
      setCurrentBvid(trimmed);
      setMessage({
        type: "ok",
        text:
          oldBvid && oldBvid !== trimmed
            ? `已覆盖: ${oldBvid} → ${trimmed}`
            : `已保存: ${trimmed}`,
      });
    } catch (e: any) {
      setMessage({
        type: "err",
        text: e?.response?.data?.detail || e.message || "设置失败",
      });
    } finally {
      setLoading(false);
    }
  }, [board, issue, bvid, currentBvid]);

  const boardLabel = BOARDS.find((b) => b.value === board)?.label ?? board;
  const isDirty = bvid.trim() !== (currentBvid ?? "");

  return (
    <div className="space-y-6 rounded-lg border p-6">
      <p className="text-sm text-muted-foreground">
        为每期榜单设置对应的 B站视频，设置后主站榜单页会展示视频播放器。
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>榜单类型</Label>
          <Select
            value={board}
            onValueChange={(v) => {
              setBoard(v);
              resetState();
            }}
          >
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

        <div className="space-y-2">
          <Label>期号</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              placeholder="如 365"
              value={issue}
              onChange={(e) => {
                setIssue(e.target.value);
                resetState();
              }}
              onKeyDown={(e) => e.key === "Enter" && handleQuery()}
            />
            <Button
              variant="outline"
              onClick={handleQuery}
              disabled={querying || !issue}
            >
              {querying ? "查询中…" : "查询"}
            </Button>
          </div>
        </div>
      </div>

      {queried && (
        <div className="rounded-md border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">
              {boardLabel} 第 {issue} 期
            </span>
            <span className="text-muted-foreground">—</span>
            {currentBvid ? (
              <a
                href={`https://www.bilibili.com/video/${currentBvid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-primary underline"
              >
                {currentBvid}
              </a>
            ) : (
              <span className="text-muted-foreground">尚未设置</span>
            )}
          </div>

          <div className="space-y-2">
            <Label>{currentBvid ? "修改 BV 号" : "设置 BV 号"}</Label>
            <div className="flex gap-2">
              <Input
                placeholder="BV1xxxxxxxxx"
                value={bvid}
                onChange={(e) => setBvid(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <Button
                onClick={handleSubmit}
                disabled={
                  loading || !bvid.trim() || (!isDirty && !!currentBvid)
                }
              >
                {loading
                  ? "保存中…"
                  : currentBvid
                    ? isDirty
                      ? "覆盖保存"
                      : "已是最新"
                    : "保存"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <p
          className={`text-sm ${message.type === "ok" ? "text-green-600" : "text-destructive"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
