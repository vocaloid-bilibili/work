// src/modules/ingest/StepRow.tsx
import { Button } from "@/ui/button";
import { Loader2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { cn } from "@/ui/cn";

type Status = "idle" | "loading" | "success" | "failed";

interface P {
  label: string;
  status: Status;
  error?: string;
  onAction: () => void;
  actionLabel: string;
  disabled?: boolean;
  showActionOnlyOnFail?: boolean;
}

export default function StepRow({
  label,
  status,
  error,
  onAction,
  actionLabel,
  disabled,
  showActionOnlyOnFail,
}: P) {
  return (
    <div
      className={cn("space-y-1", disabled && "opacity-50 pointer-events-none")}
    >
      <div
        className={cn(
          "flex items-center justify-between p-3 rounded border",
          status === "success" &&
            "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20",
          status === "failed" &&
            "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
        )}
      >
        <div className="flex items-center gap-2">
          {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
          {status === "success" && (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
          {status === "failed" && <XCircle className="h-4 w-4 text-red-600" />}
          <span>{label}</span>
        </div>
        {status === "idle" && !showActionOnlyOnFail && (
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        {status === "loading" && (
          <span className="text-sm text-muted-foreground">处理中...</span>
        )}
        {status === "failed" && (
          <Button size="sm" variant="outline" onClick={onAction}>
            <RotateCcw className="h-3 w-3 mr-1" />
            重试
          </Button>
        )}
        {status === "success" && (
          <span className="text-sm text-green-600">完成</span>
        )}
      </div>
      {error && (
        <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded whitespace-pre-wrap">
          {error}
        </div>
      )}
    </div>
  );
}
