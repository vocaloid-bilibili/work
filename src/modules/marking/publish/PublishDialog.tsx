// src/modules/marking/publish/PublishDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/ui/dialog";
import { Button } from "@/ui/button";
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
  return (
    <Dialog open={open} onOpenChange={toggle}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>发布</DialogTitle>
          <DialogDescription>{DESC[s.phase] || "准备发布"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
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
          {s.busy && (
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={s.abort}>
                取消
              </Button>
            </div>
          )}
          {s.files.length > 0 && (
            <div className="space-y-1.5">
              {s.files.map((f) => (
                <FileRow
                  key={f.fileKey}
                  file={f}
                  status={s.fileStatuses[f.fileKey] || "pending"}
                  error={s.fileErrors[f.fileKey]}
                  onRetry={
                    s.fileStatuses[f.fileKey] === "error" && !s.busy
                      ? () => s.retryFile(f)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
          <PublishLogs logs={s.logs} />
          {s.globalError && s.phase === "error" && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-600">{s.globalError}</span>
              <Button size="sm" variant="ghost" onClick={s.reset}>
                返回
              </Button>
            </div>
          )}
          {s.phase === "done" && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600">发布完成</span>
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
