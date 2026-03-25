// src/components/mark/publish/PublishDialog.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import FileRow from "./FileRow";
import PublishLogs from "./PublishLogs";
import type { usePublish } from "./usePublish";

type PublishState = ReturnType<typeof usePublish>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  state: PublishState;
}

const PHASE_DESC: Record<string, string> = {
  idle: "准备发布",
  checking: "正在检查发布锁...",
  running: "发布中...",
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
          {/* 文件状态列表 */}
          {s.files.length > 0 && (
            <div className="space-y-1.5">
              {s.files.map((file) => (
                <FileRow
                  key={file.fileKey}
                  file={file}
                  status={s.fileStatuses[file.fileKey] || "pending"}
                  error={s.fileErrors[file.fileKey]}
                />
              ))}
            </div>
          )}

          {/* 日志 */}
          <PublishLogs logs={s.logs} />

          {/* 全局错误 + 重试 */}
          {s.globalError && s.phase === "error" && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-600">{s.globalError}</span>
              <Button size="sm" variant="ghost" onClick={s.startPublish}>
                <RotateCcw className="h-3 w-3 mr-1" />
                重试
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
