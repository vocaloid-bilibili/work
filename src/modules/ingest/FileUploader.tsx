// src/modules/ingest/FileUploader.tsx
import { useState, useRef } from "react";
import { uploadFile } from "@/core/api/mainEndpoints";
import {
  parseFilename,
  type BoardId,
  type DataId,
} from "@/core/helpers/filename";
import { Input } from "@/ui/input";
import { Progress } from "@/ui/progress";
import { Card, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { FileText, CheckCircle, AlertCircle, RotateCcw, X } from "lucide-react";

interface P {
  onComplete: (id: BoardId | DataId) => void;
}

export default function FileUploader({ onComplete }: P) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setProgress(0);
    setSuccess(false);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const upload = async (f: File) => {
    try {
      setUploading(true);
      setError("");
      const identity = parseFilename(f.name);
      await uploadFile(f, (p) => setProgress(p * 100));
      setSuccess(true);
      onComplete(identity);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err?.message ?? "上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setProgress(0);
    setSuccess(false);
    setError("");
    await upload(f);
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6 space-y-4">
        {!file ? (
          <Input
            ref={inputRef}
            type="file"
            onChange={handleChange}
            className="cursor-pointer"
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
                  onClick={reset}
                  className="ml-auto"
                >
                  上传新文件
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => file && upload(file)}
                  >
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
      </CardContent>
    </Card>
  );
}
