// src/modules/marking/publish/PublishLogs.tsx
import { useEffect, useRef } from "react";

export default function PublishLogs({ logs }: { logs: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);
  if (!logs.length) return null;
  return (
    <div
      ref={ref}
      className="text-xs font-mono text-muted-foreground bg-muted p-3 rounded max-h-48 overflow-y-auto space-y-px"
    >
      {logs.map((m, i) => (
        <div key={i}>{m}</div>
      ))}
    </div>
  );
}
