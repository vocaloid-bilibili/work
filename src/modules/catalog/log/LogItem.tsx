// src/modules/catalog/log/LogItem.tsx

import { useState } from "react";
import { Badge } from "@/ui/badge";
import { Check, Clock } from "lucide-react";
import type { EditLogEntry } from "@/core/api/collabEndpoints";
import { ACTION_LABELS, ACTION_COLORS, TARGET_LABELS } from "./constants";
import { formatTime, relativeTime } from "./utils";
import ChangesDetail from "./ChangesDetail";

interface LogItemProps {
  log: EditLogEntry;
  syncCursor: number | null;
}

export default function LogItem({ log, syncCursor }: LogItemProps) {
  const [expanded, setExpanded] = useState(false);
  const synced = syncCursor !== null && log.id <= syncCursor;

  return (
    <div
      className="border rounded-lg p-3 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {syncCursor !== null && (
            <span
              title={synced ? "已同步到 collected" : "待同步"}
              className={`shrink-0 ${synced ? "text-green-500" : "text-muted-foreground/40"}`}
            >
              {synced ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Clock className="h-3.5 w-3.5" />
              )}
            </span>
          )}
          <Badge
            variant="secondary"
            className={`text-[11px] shrink-0 ${ACTION_COLORS[log.action] || ""}`}
          >
            {ACTION_LABELS[log.action] || log.action}
          </Badge>
          <span className="text-sm font-medium truncate">
            {TARGET_LABELS[log.targetType] || log.targetType}
          </span>
          <span className="text-xs text-muted-foreground font-mono truncate">
            {log.targetId}
          </span>
        </div>
        <div className="text-right shrink-0">
          <div
            className="text-xs text-muted-foreground"
            title={formatTime(log.createdAt)}
          >
            {relativeTime(log.createdAt)}
          </div>
          <div className="text-xs text-muted-foreground">
            {log.userName || log.userId}
          </div>
        </div>
      </div>

      {expanded && log.detail && <ChangesDetail detail={log.detail} />}

      {!expanded && log.detail && (
        <div className="mt-1 text-xs text-muted-foreground/60">
          点击展开详情
        </div>
      )}
    </div>
  );
}
