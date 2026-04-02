// src/modules/editor/log/SyncBar.tsx
import { useState, useEffect, useRef } from "react";
import { Check, Clock, Loader2, Lock } from "lucide-react";
import { getSyncStatus, type SyncStatus } from "@/core/api/collabEndpoints";

interface Props {
  onCursorLoaded?: (cursor: number) => void;
}

export default function SyncBar({ onCursorLoaded }: Props) {
  const [st, setSt] = useState<SyncStatus | null>(null);
  const [err, setErr] = useState(false);
  const cbRef = useRef(onCursorLoaded);
  cbRef.current = onCursorLoaded;

  useEffect(() => {
    let dead = false;
    getSyncStatus()
      .then((s) => {
        if (!dead) {
          setSt(s);
          cbRef.current?.(s.cursor);
        }
      })
      .catch(() => {
        if (!dead) setErr(true);
      });
    return () => {
      dead = true;
    };
  }, []);

  if (err || !st) {
    if (err) return null;
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
      </span>
    );
  }

  if (st.locked)
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
        <Lock className="h-3 w-3" />
        同步进行中{st.lockHolder ? `（${st.lockHolder}）` : ""}
      </span>
    );

  if (st.pending === 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <Check className="h-3 w-3" />
        已全部同步
      </span>
    );

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      {st.pending} 条待同步
    </span>
  );
}
