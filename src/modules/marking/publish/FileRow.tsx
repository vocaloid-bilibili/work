// src/modules/marking/publish/FileRow.tsx
import { Loader2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { cn } from "@/ui/cn";
import { Checkbox } from "@/ui/checkbox";
import { STATUS_LABEL, type PubFile, type FileStatus } from "./types";

interface P {
  file: PubFile;
  status: FileStatus;
  error?: string;
  selectable?: boolean;
  selected?: boolean;
  onSelectChange?: (v: boolean) => void;
  onRetry?: () => void;
}

export default function FileRow({
  file,
  status,
  error,
  selectable,
  selected,
  onSelectChange,
  onRetry,
}: P) {
  const loading =
    status === "downloading" ||
    status === "uploading" ||
    status === "importing";

  return (
    <div>
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 rounded border text-sm",
          status === "done" && "border-green-200 dark:border-green-900",
          status === "error" && "border-red-200 dark:border-red-900",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectable && (
            <Checkbox
              checked={selected ?? false}
              onCheckedChange={(v) => onSelectChange?.(Boolean(v))}
              disabled={loading || status === "done"}
            />
          )}
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
          {status === "done" && (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
          )}
          {status === "error" && (
            <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
          )}
          {status === "pending" && !selectable && (
            <div className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">{file.filename}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="text-xs text-muted-foreground">
            {STATUS_LABEL[status]}
          </span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
            >
              <RotateCcw className="h-3 w-3" />
              重试
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-600 mt-0.5 px-3">{error}</p>}
    </div>
  );
}
