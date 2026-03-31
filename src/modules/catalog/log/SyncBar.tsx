// src/modules/catalog/log/SyncBar.tsx

import { useState, useEffect } from "react";
import { Check, Clock, Loader2, Lock } from "lucide-react";
import { getSyncStatus, type SyncStatus } from "@/core/api/collabEndpoints";

interface SyncBarProps {
  onCursorLoaded: (cursor: number) => void;
}

export default function SyncBar({ onCursorLoaded }: SyncBarProps) {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSyncStatus()
      .then((s) => {
        if (!cancelled) {
          setStatus(s);
          onCursorLoaded(s.cursor);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [onCursorLoaded]);

  if (error) return null;
  if (!status) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        加载同步状态…
      </div>
    );
  }

  const allSynced = status.pending === 0;

  return (
    <div className="flex items-center gap-3 text-xs">
      {status.locked ? (
        <span className="flex items-center gap-1 text-amber-600">
          <Lock className="h-3 w-3" />
          同步中
          {status.lockHolder && (
            <span className="text-muted-foreground">({status.lockHolder})</span>
          )}
        </span>
      ) : allSynced ? (
        <span className="flex items-center gap-1 text-green-600">
          <Check className="h-3 w-3" />
          全部已同步
        </span>
      ) : (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            <span className="font-medium text-foreground">
              {status.pending}
            </span>{" "}
            条待同步
          </span>
        </span>
      )}
      <span className="text-muted-foreground/50">
        游标: {status.cursor} / {status.maxLogId}
      </span>
    </div>
  );
}
