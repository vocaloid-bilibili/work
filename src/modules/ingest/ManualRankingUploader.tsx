// src/modules/ingest/ManualRankingUploader.tsx
import { useState, useRef } from "react";
import { uploadRankingFile } from "@/core/api/mainEndpoints";
import { BOARDS, NO_NEW_PART_BOARDS, PARTS } from "@/core/types/constants";
import type { BoardId } from "@/core/helpers/filename";
import { Input } from "@/ui/input";
import { Progress } from "@/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import {
  FileText,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";

interface P {
  onComplete: (id: BoardId) => void;
}

export default function ManualRankingUploader({ onComplete }: P) {
  const [file, setFile] = useState<File | null>(null);
  const [board, setBoard] = useState("");
  const [part, setPart] = useState("main");
  const [issue, setIssue] = useState<number | "">("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isSpecial = board === "special";
  const noNewPart = NO_NEW_PART_BOARDS.has(board);

  const reset = () => {
    setFile(null);
    setProgress(0);
    setSuccess(false);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const fullReset = () => {
    reset();
    setBoard("");
    setPart("main");
    setIssue("");
  };

  const canSubmit =
    file && board && part.trim() && typeof issue === "number" && !uploading;

  const upload = async () => {
    if (!file || !board || !part.trim() || typeof issue !== "number") return;
    try {
      setUploading(true);
      setError("");
      await uploadRankingFile(file, board, part.trim(), issue, (p) =>
        setProgress(p * 100),
      );
      setSuccess(true);
      onComplete({
        board: board as BoardId["board"],
        part: part as "main" | "new",
        issue,
      });
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err?.message ?? "上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setProgress(0);
    setSuccess(false);
    setError("");
  };

  // 切换 board 时自动修正 part
  const handleBoardChange = (v: string) => {
    setBoard(v);
    if (NO_NEW_PART_BOARDS.has(v) && part === "new") {
      setPart("main");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">手动上传排名</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Board 选择 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">榜单</Label>
            <Select value={board} onValueChange={handleBoardChange}>
              <SelectTrigger>
                <SelectValue placeholder="选择榜单" />
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

          {/* Part 选择 */}
          <div className="space-y-1.5">
            <Label className="text-xs">板块</Label>
            {isSpecial ? (
              <Input
                value={part}
                onChange={(e) => setPart(e.target.value)}
                placeholder="板块名称"
              />
            ) : (
              <Select value={part} onValueChange={setPart} disabled={!board}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTS.filter((p) => !(noNewPart && p.value === "new")).map(
                    (p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Issue 输入 */}
          <div className="space-y-1.5">
            <Label className="text-xs">期号</Label>
            <Input
              type="number"
              value={issue}
              onChange={(e) =>
                setIssue(e.target.value ? parseInt(e.target.value, 10) : "")
              }
              placeholder={board === "vocaloid-annual" ? "年份" : "期号"}
              disabled={!board}
            />
          </div>
        </div>

        {/* 文件选择 */}
        {!file ? (
          <Input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="cursor-pointer"
            disabled={!board}
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <div className="flex items-center gap-2 text-sm truncate">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
              {!uploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {!success && !error && !uploading && (
              <Button onClick={upload} disabled={!canSubmit} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                上传
              </Button>
            )}

            {uploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>上传中...</span>
                  <span>{Math.floor(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 rounded bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">上传成功</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fullReset}
                  className="ml-auto"
                >
                  继续上传
                </Button>
              </div>
            )}

            {error && (
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 rounded bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={upload}>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    重试
                  </Button>
                  <Button variant="ghost" size="sm" onClick={reset}>
                    换文件
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          适用于特刊或需要手动指定参数的排名文件
        </p>
      </CardContent>
    </Card>
  );
}
