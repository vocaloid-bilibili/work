// src/modules/editor/log/LogItem.tsx
import { Badge } from "@/ui/badge";
import { cn } from "@/ui/cn";
import type { EditLogEntry } from "@/core/api/collabEndpoints";
import { ACTIONS } from "./constants";
import { relativeTime, formatTime } from "./utils";
import { describe } from "./describe";

interface Props {
  log: EditLogEntry;
  syncCursor: number | null;
}

export default function LogItem({ log, syncCursor }: Props) {
  const meta = ACTIONS[log.action];
  const { headline, lines } = describe(log.action, log.detail);
  const user = log.userName || log.userId || "未知用户";
  const synced = syncCursor !== null && log.id <= syncCursor;

  const dotCls =
    syncCursor === null
      ? (meta?.dot ?? "bg-muted-foreground")
      : synced
        ? (meta?.dot ?? "bg-muted-foreground")
        : "ring-1 ring-muted-foreground/40 bg-transparent";

  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center pt-1.5 shrink-0">
        <div
          className={cn("w-2 h-2 rounded-full", dotCls)}
          title={
            syncCursor !== null ? (synced ? "已同步" : "待同步") : undefined
          }
        />
        <div className="w-px flex-1 bg-border group-last:hidden" />
      </div>

      <div className="pb-5 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{user}</span>
          <Badge
            variant="secondary"
            className={cn("text-[10px] px-1.5 py-0", meta?.color)}
          >
            {meta?.label ?? log.action}
          </Badge>
          <span
            className="text-xs text-muted-foreground ml-auto shrink-0"
            title={formatTime(log.createdAt)}
          >
            {relativeTime(log.createdAt)}
          </span>
        </div>

        <p className="text-sm text-foreground/80 mt-1">{headline}</p>

        {lines.length > 0 && (
          <div className="mt-1.5 text-xs space-y-0.5 text-muted-foreground">
            {lines.map((line, i) => (
              <div key={i} className="flex items-start gap-1">
                <span className="text-muted-foreground/40 shrink-0">·</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
