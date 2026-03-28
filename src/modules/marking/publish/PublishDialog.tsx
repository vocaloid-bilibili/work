// src/modules/marking/publish/PublishDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/ui/dialog";
import { Button } from "@/ui/button";
import { CheckCircle2 } from "lucide-react";
import FileRow from "./FileRow";
import PublishLogs from "./PublishLogs";
import { MODE_OPTIONS } from "./types";
import type { usePublish } from "./usePublish";

type S = ReturnType<typeof usePublish>;

const DESC: Record<string, string> = {
  idle: "选择发布模式",
  checking: "正在检查...",
  phase1: "服务器处理中...",
  phase2: "正在导入数据库...",
  done: "发布完成",
  error: "发布出错",
};

export default function PublishDialog({
  open,
  onOpenChange,
  state: s,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  state: S;
}) {
  const toggle = (v: boolean) => {
    if (s.busy) return;
    onOpenChange(v);
    if (!v) s.reset();
  };

  const showFileSelect =
    s.files.length > 0 && (s.phase === "error" || s.phase === "done");
  const hasUndone = s.files.some((f) => s.fileStatuses[f.fileKey] !== "done");

  return (
    <Dialog open={open} onOpenChange={toggle}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>发布</DialogTitle>
          <DialogDescription>{DESC[s.phase] || "准备发布"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {/* 模式选择 */}
          {s.phase === "idle" && (
            <div className="space-y-2">
              {MODE_OPTIONS.map((o) => (
                <button
                  key={o.mode}
                  onClick={() => s.startPublish(o.mode)}
                  className="w-full flex flex-col gap-0.5 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                >
                  <span className="font-medium text-sm">{o.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {o.desc}
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

          {/* 文件列表 */}
          {s.files.length > 0 && (
            <div className="space-y-1.5">
              {s.files.map((f) => (
                <FileRow
                  key={f.fileKey}
                  file={f}
                  status={s.fileStatuses[f.fileKey] || "pending"}
                  error={s.fileErrors[f.fileKey]}
                  selectable={
                    showFileSelect && s.fileStatuses[f.fileKey] !== "done"
                  }
                  selected={s.fileSelection[f.fileKey] ?? false}
                  onSelectChange={(v) => s.toggleFile(f.fileKey, v)}
                  onRetry={
                    s.fileStatuses[f.fileKey] === "error" && !s.busy
                      ? () => s.retryFile(f)
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          {/* 批量操作栏 */}
          {showFileSelect && hasUndone && (
            <div className="flex items-center justify-between border-t pt-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7"
                  onClick={s.selectAllFiles}
                >
                  全选未完成
                </Button>
                {s.selectedCount > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7"
                    onClick={s.deselectAll}
                  >
                    取消全选
                  </Button>
                )}
              </div>
              <Button
                size="sm"
                disabled={s.selectedCount === 0 || s.busy}
                onClick={s.retrySelected}
                className="gap-1.5"
              >
                重新处理 ({s.selectedCount})
              </Button>
            </div>
          )}

          {/* 日志 */}
          <PublishLogs logs={s.logs} />

          {/* 错误提示 */}
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
              <span className="text-green-600 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                发布完成
              </span>
              <Button size="sm" variant="ghost" onClick={() => toggle(false)}>
                关闭
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
