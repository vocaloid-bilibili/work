// src/components/mark/publish/PublishDialog.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FileRow from "./FileRow";
import PublishLogs from "./PublishLogs";
import { MODE_OPTIONS } from "./types";
import type { usePublish } from "./usePublish";

type PublishState = ReturnType<typeof usePublish>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  state: PublishState;
}

const PHASE_DESC: Record<string, string> = {
  idle: "选择发布模式",
  checking: "正在检查发布锁...",
  phase1: "服务器处理中...",
  phase2: "正在导入数据库...",
  done: "发布完成",
  error: "发布出错",
};

export default function PublishDialog({ open, onOpenChange, state: s }: Props) {
  const handleOpenChange = (v: boolean) => {
    if (s.busy) return;
    onOpenChange(v);
    if (!v) s.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>发布</DialogTitle>
          <DialogDescription>
            {PHASE_DESC[s.phase] || "准备发布"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* 模式选择 */}
          {s.phase === "idle" && (
            <div className="space-y-2">
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.mode}
                  onClick={() => s.startPublish(opt.mode)}
                  className="w-full flex flex-col gap-0.5 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                >
                  <span className="font-medium text-sm">{opt.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 取消按钮 */}
          {s.busy && (
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={s.abort}>
                取消
              </Button>
            </div>
          )}

          {/* 文件状态列表 */}
          {s.files.length > 0 && (
            <div className="space-y-1.5">
              {s.files.map((file) => (
                <FileRow
                  key={file.fileKey}
                  file={file}
                  status={s.fileStatuses[file.fileKey] || "pending"}
                  error={s.fileErrors[file.fileKey]}
                  onRetry={
                    s.fileStatuses[file.fileKey] === "error" && !s.busy
                      ? () => s.retryFile(file)
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          {/* 日志 */}
          <PublishLogs logs={s.logs} />

          {/* 全局错误 */}
          {s.globalError && s.phase === "error" && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-600">{s.globalError}</span>
              <Button size="sm" variant="ghost" onClick={s.reset}>
                返回
              </Button>
            </div>
          )}

          {/* 完成 */}
          {s.phase === "done" && (
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
  );
}
