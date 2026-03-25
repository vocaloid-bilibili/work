// src/components/mark/publish/FileRow.tsx

import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type PublishFile, type FileStatus } from "./types";

interface Props {
  file: PublishFile;
  status: FileStatus;
  error?: string;
}

export default function FileRow({ file, status, error }: Props) {
  const loading = status === "uploading" || status === "importing";

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
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
          {status === "done" && (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
          )}
          {status === "error" && (
            <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
          )}
          {status === "pending" && <div className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{file.filename}</span>
        </div>
        <span className="text-xs text-muted-foreground shrink-0 ml-3">
          {STATUS_LABEL[status]}
        </span>
      </div>
      {error && <p className="text-xs text-red-600 mt-0.5 px-3">{error}</p>}
    </div>
  );
}
