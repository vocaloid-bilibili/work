// src/components/mark/publish/PublishLogs.tsx

import { useEffect, useRef } from "react";

interface Props {
  logs: string[];
}

export default function PublishLogs({ logs }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div
      ref={ref}
      className="text-xs font-mono text-muted-foreground bg-muted p-3 rounded max-h-48 overflow-y-auto space-y-px"
    >
      {logs.map((msg, i) => (
        <div key={i}>{msg}</div>
      ))}
    </div>
  );
}
