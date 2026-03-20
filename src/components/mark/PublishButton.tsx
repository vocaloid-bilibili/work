// src/components/mark/PublishButton.tsx
import { useState, useCallback, useRef, useEffect } from "react";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2, XCircle, RotateCcw, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoardFile {
  type: "board";
  board: string;
  part: string;
  issue: number;
  filename: string;
  fileKey: string;
}

interface SnapshotFile {
  type: "snapshot";
  date: string;
  filename: string;
  fileKey: string;
}

type PublishFile = BoardFile | SnapshotFile;

type FileStatus =
  | "pending"
  | "downloading"
  | "uploading"
  | "importing"
  | "done"
  | "error";

const STATUS_LABEL: Record<FileStatus, string> = {
  pending: "等待中",
  downloading: "下载中",
  uploading: "上传中",
  importing: "导入中",
  done: "完成",
  error: "失败",
};

export default function PublishButton({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<
    "idle" | "phase1" | "phase2" | "done" | "error"
  >("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [files, setFiles] = useState<PublishFile[]>([]);
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileStatus>>(
    {},
  );
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const logsRef = useRef<HTMLDivElement>(null);

  const log = useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg]);
  }, []);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  const runPhase1 = async (): Promise<PublishFile[]> => {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`/api/tasks/${taskId}/publish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: "请求失败" }));
      throw new Error(body.message || `HTTP ${res.status}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fileList: PublishFile[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          log(event.message);
          if (event.step === "done" && event.files) fileList = event.files;
          if (event.error) throw new Error(event.message);
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }

    if (fileList.length === 0) throw new Error("服务器未返回文件列表");
    return fileList;
  };

  const processFile = async (file: PublishFile) => {
    const token = localStorage.getItem("token") || "";

    setFileStatuses((p) => ({ ...p, [file.fileKey]: "downloading" }));
    const dlRes = await fetch(`/api/tasks/publish/files/${file.fileKey}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!dlRes.ok) throw new Error(`下载 ${file.filename} 失败`);

    const blob = await dlRes.blob();
    const fileObj = new File([blob], file.filename, { type: blob.type });

    setFileStatuses((p) => ({ ...p, [file.fileKey]: "uploading" }));
    log(`上传 ${file.filename}`);
    await api.uploadFile(fileObj, { onProgress: () => {} });

    setFileStatuses((p) => ({ ...p, [file.fileKey]: "importing" }));

    if (file.type === "board") {
      const label = file.part === "new" ? "新曲榜" : "主榜";
      log(`导入${label}第${file.issue}期`);
      await new Promise<void>((resolve, reject) => {
        api.updateRanking(file.board, file.part, file.issue, false, {
          onProgress: (msg: string) => log(`  ${msg}`),
          onComplete: () => {
            log(`${label}第${file.issue}期导入完成`);
            resolve();
          },
          onError: (err: any) => reject(new Error(err?.message || "导入失败")),
        });
      });
    } else {
      log(`导入快照 ${file.date}`);
      await new Promise<void>((resolve, reject) => {
        api.updateSnapshot(file.date, false, {
          onProgress: (msg: string) => log(`  ${msg}`),
          onComplete: () => {
            log(`快照 ${file.date} 导入完成`);
            resolve();
          },
          onError: (err: any) => reject(new Error(err?.message || "导入失败")),
        });
      });
    }

    setFileStatuses((p) => ({ ...p, [file.fileKey]: "done" }));

    fetch(`/api/tasks/publish/files/${file.fileKey}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  };

  const startPublish = async () => {
    setPhase("phase1");
    setLogs([]);
    setFiles([]);
    setFileStatuses({});
    setFileErrors({});
    setGlobalError("");

    try {
      const fileList = await runPhase1();
      setFiles(fileList);
      setFileStatuses(
        Object.fromEntries(
          fileList.map((f) => [f.fileKey, "pending" as const]),
        ),
      );
      setPhase("phase2");

      let allDone = true;
      for (const file of fileList) {
        try {
          await processFile(file);
        } catch (err: any) {
          allDone = false;
          setFileStatuses((p) => ({ ...p, [file.fileKey]: "error" }));
          setFileErrors((p) => ({
            ...p,
            [file.fileKey]: err.message || "失败",
          }));
          log(`${file.filename} 失败: ${err.message}`);
        }
      }

      if (allDone) {
        setPhase("done");
        log("全部发布完成");
      } else {
        setPhase("error");
        setGlobalError("部分文件处理失败");
      }
    } catch (err: any) {
      setPhase("error");
      setGlobalError(err.message || "发布失败");
      log(err.message || "发布失败");
    }
  };

  const retryFile = async (file: PublishFile) => {
    setFileErrors((p) => {
      const next = { ...p };
      delete next[file.fileKey];
      return next;
    });
    try {
      await processFile(file);
      setFileStatuses((prev) => {
        const next = { ...prev, [file.fileKey]: "done" as const };
        if (Object.values(next).every((s) => s === "done")) {
          setPhase("done");
          log("全部发布完成");
        }
        return next;
      });
    } catch (err: any) {
      setFileStatuses((p) => ({ ...p, [file.fileKey]: "error" }));
      setFileErrors((p) => ({ ...p, [file.fileKey]: err.message || "失败" }));
      log(`${file.filename} 失败: ${err.message}`);
    }
  };

  const busy = phase === "phase1" || phase === "phase2";

  const handleOpenChange = (v: boolean) => {
    if (busy) return; // 进行中不允许关闭
    setOpen(v);
    if (!v) {
      setPhase("idle");
      setLogs([]);
      setFiles([]);
      setFileStatuses({});
      setFileErrors({});
      setGlobalError("");
    }
  };

  const handleClick = () => {
    setOpen(true);
    // 直接开始
    setTimeout(() => startPublish(), 0);
  };

  return (
    <>
      <Button
        variant="outline"
        className="gap-2"
        onClick={handleClick}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        发布
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>发布</DialogTitle>
            <DialogDescription>
              {phase === "phase1" && "服务器处理中..."}
              {phase === "phase2" && "正在上传和导入..."}
              {phase === "done" && "发布完成"}
              {phase === "error" && "发布出错"}
              {phase === "idle" && "准备发布"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {files.length > 0 && (
              <div className="space-y-1.5">
                {files.map((file) => {
                  const status = fileStatuses[file.fileKey] || "pending";
                  const err = fileErrors[file.fileKey];
                  const loading =
                    status === "downloading" ||
                    status === "uploading" ||
                    status === "importing";
                  return (
                    <div key={file.fileKey}>
                      <div
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded border text-sm",
                          status === "done" &&
                            "border-green-200 dark:border-green-900",
                          status === "error" &&
                            "border-red-200 dark:border-red-900",
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {loading && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                          )}
                          {status === "done" && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                          )}
                          {status === "error" && (
                            <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                          )}
                          {status === "pending" && (
                            <div className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="truncate">{file.filename}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="text-xs text-muted-foreground">
                            {STATUS_LABEL[status]}
                          </span>
                          {status === "error" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => retryFile(file)}
                              className="h-7 px-2"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {err && (
                        <p className="text-xs text-red-600 mt-0.5 px-3">
                          {err}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {logs.length > 0 && (
              <div
                ref={logsRef}
                className="text-xs font-mono text-muted-foreground bg-muted p-3 rounded max-h-48 overflow-y-auto space-y-px"
              >
                {logs.map((msg, i) => (
                  <div key={i}>{msg}</div>
                ))}
              </div>
            )}

            {globalError && phase === "error" && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-600">{globalError}</span>
                <Button size="sm" variant="ghost" onClick={startPublish}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  重试
                </Button>
              </div>
            )}

            {phase === "done" && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600">发布完成</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                >
                  关闭
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
