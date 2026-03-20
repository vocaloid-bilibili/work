import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Rocket,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCollabBase } from "@/utils/collabApi";
import { getValidAccessToken } from "@/utils/auth";

interface ProgressEvent {
  step: string;
  message: string;
  error?: boolean;
  detail?: string;
  at: string;
}

function EventItem({
  event,
  isLast,
}: {
  event: ProgressEvent;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isDone = event.step === "done";
  const isError = event.error;

  return (
    <div
      className={cn(
        "py-2 px-3 rounded-lg transition-colors",
        isLast && !isDone && !isError && "bg-blue-50/50 dark:bg-blue-950/20",
        isDone && "bg-emerald-50/50 dark:bg-emerald-950/20",
        isError && "bg-red-50/50 dark:bg-red-950/20",
      )}
    >
      <div className="flex items-center gap-2">
        {isLast && !isDone && !isError ? (
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
        ) : isDone ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        ) : isError ? (
          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        )}
        <span
          className={cn(
            "text-sm flex-1",
            isDone && "font-semibold text-emerald-700 dark:text-emerald-400",
            isError && "font-semibold text-red-600 dark:text-red-400",
          )}
        >
          {event.message}
        </span>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {new Date(event.at).toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
        {event.detail && (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>
        )}
      </div>
      {expanded && event.detail && (
        <pre className="mt-1.5 ml-6 text-[11px] text-muted-foreground bg-muted/50 p-2 rounded max-h-32 overflow-auto whitespace-pre-wrap break-all">
          {event.detail}
        </pre>
      )}
    </div>
  );
}

interface Props {
  taskId: string | null;
  disabled?: boolean;
}

export default function PublishButton({ taskId, disabled }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const el = scrollRef.current;
      if (el) {
        const viewport = el.querySelector("[data-radix-scroll-area-viewport]");
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
      }
    }, 50);
  }, []);

  const startPublish = useCallback(async () => {
    if (!taskId) return;

    setConfirmOpen(false);
    setProgressOpen(true);
    setEvents([]);
    setRunning(true);
    setFinished(false);

    try {
      const token = await getValidAccessToken();
      if (!token) throw new Error("未登录");

      const response = await fetch(
        `${getCollabBase()}/mark/tasks/${taskId}/publish`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as any).message || `HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop()!;

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line) as ProgressEvent;
            setEvents((prev) => [...prev, event]);
            scrollToBottom();
          } catch {}
        }
      }

      // 处理最后的 buffer
      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer) as ProgressEvent;
          setEvents((prev) => [...prev, event]);
        } catch {}
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "发布失败";
      setEvents((prev) => [
        ...prev,
        {
          step: "error",
          message: `❌ ${msg}`,
          error: true,
          at: new Date().toISOString(),
        },
      ]);
    } finally {
      setRunning(false);
      setFinished(true);
    }
  }, [taskId, scrollToBottom]);

  const lastEvent = events[events.length - 1];
  const isSuccess = lastEvent?.step === "done" && !lastEvent?.error;
  const isError = lastEvent?.error;

  return (
    <>
      <Button
        variant="default"
        className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
        disabled={!taskId || disabled || running}
        onClick={() => setConfirmOpen(true)}
      >
        <Rocket className="h-4 w-4" />
        发布
      </Button>

      {/* 确认对话框 */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              确认发布
            </DialogTitle>
            <DialogDescription>发布将执行以下操作：</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. 导出已收录记录到数据服务器</p>
            <p>2. 运行合并脚本和排行榜脚本</p>
            <p>3. 下载生成的排行榜和数据快照</p>
            <p>4. 上传到主站并触发更新</p>
            <p className="text-amber-600 dark:text-amber-400 font-medium pt-2">
              整个过程可能需要 5-10 分钟，请勿关闭页面。
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              取消
            </Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
              onClick={startPublish}
            >
              <Rocket className="h-4 w-4" />
              开始发布
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 进度对话框 */}
      <Dialog
        open={progressOpen}
        onOpenChange={(v) => {
          if (running) return; // 运行中不可关闭
          setProgressOpen(v);
        }}
      >
        <DialogContent
          className="max-w-lg max-h-[80vh] p-0 flex flex-col"
          onPointerDownOutside={(e) => running && e.preventDefault()}
          onEscapeKeyDown={(e) => running && e.preventDefault()}
        >
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="flex items-center gap-2">
              {running ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  正在发布...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  发布完成
                </>
              ) : isError ? (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  发布失败
                </>
              ) : (
                "发布"
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">发布进度</DialogDescription>
          </DialogHeader>

          <ScrollArea ref={scrollRef} className="flex-1 min-h-0 px-5">
            <div className="space-y-1 pb-4">
              {events.map((event, i) => (
                <EventItem
                  key={`${event.step}-${i}`}
                  event={event}
                  isLast={i === events.length - 1 && running}
                />
              ))}
              {events.length === 0 && running && (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  正在连接...
                </div>
              )}
            </div>
          </ScrollArea>

          {finished && (
            <div className="px-5 py-3 border-t">
              <Button
                className="w-full"
                variant={isSuccess ? "default" : "outline"}
                onClick={() => setProgressOpen(false)}
              >
                {isSuccess ? "完成" : "关闭"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
