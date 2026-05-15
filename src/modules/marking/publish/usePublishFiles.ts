// src/modules/marking/publish/usePublishFiles.ts
import { useCallback } from "react";
import * as api from "@/core/api/mainEndpoints";
import { streamRanking, streamSnapshot } from "@/core/api/sseStream";
import { collabBase } from "@/core/api/collabClient";
import type { PubFile, FileStatus } from "./types";
import { PARTS } from "@/core/types/constants";

interface FileSetters {
  setStatus: (key: string, s: FileStatus) => void;
  log: (msg: string) => void;
}

export function usePublishFiles({ setStatus, log }: FileSetters) {
  const processFile = useCallback(
    async (file: PubFile) => {
      // download
      setStatus(file.fileKey, "downloading");
      const dl = await fetch(
        `${collabBase()}/mark/tasks/publish/files/${file.fileKey}`,
        { credentials: "include" },
      );
      if (!dl.ok) throw new Error(`下载 ${file.filename} 失败`);
      const blob = await dl.blob();
      const fo = new File([blob], file.filename, { type: blob.type });

      // upload
      setStatus(file.fileKey, "uploading");
      log(`上传 ${file.filename}`);
      await api.uploadFile(fo);

      // import
      setStatus(file.fileKey, "importing");
      if (file.type === "board") {
        const label =
          PARTS.find((p) => p.value === file.part)?.label ?? file.part;
        log(`导入${label}第${file.issue}期`);
        await new Promise<void>((ok, fail) => {
          streamRanking(file.board, file.part, file.issue, {
            onProgress: (m) => log(`  ${m}`),
            onComplete: () => {
              log(`${label}第${file.issue}期导入完成`);
              ok();
            },
            onError: (e) =>
              fail(e instanceof Error ? e : new Error("导入失败")),
          });
        });
      } else {
        log(`导入快照 ${file.date}`);
        await new Promise<void>((ok, fail) => {
          streamSnapshot(file.date, {
            onProgress: (m) => log(`  ${m}`),
            onComplete: () => {
              log(`快照 ${file.date} 导入完成`);
              ok();
            },
            onError: (e) =>
              fail(e instanceof Error ? e : new Error("导入失败")),
          });
        });
      }

      setStatus(file.fileKey, "done");

      // cleanup (fire and forget)
      fetch(`${collabBase()}/mark/tasks/publish/files/${file.fileKey}`, {
        method: "DELETE",
        credentials: "include",
      }).catch(() => {});
    },
    [setStatus, log],
  );

  return { processFile };
}
