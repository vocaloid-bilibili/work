// src/modules/marking/hooks/useMarkUpload.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { sanitizeRow, filled } from "@/core/helpers/sanitize";
import type { Row } from "@/core/types/collab";

interface MarkUploadOpts {
  isCollab: boolean;
  setRecords: React.Dispatch<React.SetStateAction<Row[]>>;
  setIncludes: React.Dispatch<React.SetStateAction<boolean[]>>;
  setBlacklists: React.Dispatch<React.SetStateAction<boolean[]>>;
  setStatus: (s: "idle" | "loading" | "ready") => void;
  setFileName: (name: string) => void;
  setPage: (p: number) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  collabUpload: (file: File) => Promise<void>;
}

export function useMarkUpload({
  isCollab,
  setRecords,
  setIncludes,
  setBlacklists,
  setStatus,
  setFileName,
  setPage,
  fileRef,
  collabUpload,
}: MarkUploadOpts) {
  const [uploading, setUploading] = useState(false);

  const loadFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);

      if (isCollab) {
        setUploading(true);
        collabUpload(file)
          .then(() => toast.success("上传成功"))
          .catch((err) =>
            toast.error(err instanceof Error ? err.message : "上传失败"),
          )
          .finally(() => setUploading(false));
        return;
      }

      setStatus("loading");
      const reader = new FileReader();
      reader.onload = (ev) => {
        const buffer = ev.target?.result as ArrayBuffer;
        const worker = new Worker(
          new URL("../../../workers/xlsx.worker.ts", import.meta.url),
          { type: "module" },
        );
        worker.postMessage({ file: buffer });
        worker.onmessage = (msg) => {
          if (msg.data && typeof msg.data === "object" && "error" in msg.data) {
            toast.error(`解析失败：${msg.data.error}`);
            worker.terminate();
            setStatus("idle");
            return;
          }
          const rows = (msg.data as Row[]).map(sanitizeRow);
          setRecords(rows);
          setIncludes(
            rows.map(
              (r) => filled(r.vocal) && filled(r.synthesizer) && filled(r.type),
            ),
          );
          setBlacklists(new Array(rows.length).fill(false));
          setPage(1);
          worker.terminate();
          setStatus("ready");
        };
        worker.onerror = () => {
          toast.error("解析文件时发生错误");
          worker.terminate();
          setStatus("idle");
        };
      };
      reader.onerror = () => {
        toast.error("文件读取失败，请重试");
        setStatus("idle");
      };
      reader.readAsArrayBuffer(file);
    },
    [
      isCollab,
      collabUpload,
      setRecords,
      setIncludes,
      setBlacklists,
      setPage,
      setStatus,
      setFileName,
    ],
  );

  return { uploading, loadFile };
}
