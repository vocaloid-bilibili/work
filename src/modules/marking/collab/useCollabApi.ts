// src/modules/marking/collab/useCollabApi.ts
import { useCallback } from "react";
import {
  collabGet,
  collabUpload,
  collabDownload,
} from "@/core/api/collabClient";
import type { Snapshot } from "@/core/types/collab";

interface TaskStatsResult {
  contributors: { user: { id: string } }[];
  [key: string]: unknown;
}
interface TaskOpsResult {
  ops: Record<string, unknown>[];
  total: number;
  hasMore: boolean;
}
interface TaskListResult {
  tasks: Record<string, unknown>[];
}

export function useCollabApi(taskIdRef: React.RefObject<string | null>) {
  const fetchTaskStats = useCallback(
    async (tid?: string) => {
      const id = tid || taskIdRef.current;
      if (!id) return null;
      return collabGet<TaskStatsResult>(`/mark/tasks/${id}/stats`);
    },
    [taskIdRef],
  );

  const fetchTaskOps = useCallback(
    async (tid: string, limit: number, offset: number) =>
      collabGet<TaskOpsResult>(
        `/mark/tasks/${tid}/ops?limit=${limit}&offset=${offset}`,
      ),
    [],
  );

  const fetchTaskList = useCallback(
    () => collabGet<TaskListResult>("/mark/tasks"),
    [],
  );

  const fetchGlobalStats = useCallback(
    () => collabGet<Record<string, unknown>>("/mark/tasks/stats/global"),
    [],
  );

  const uploadTask = useCallback(
    async (file: File) => collabUpload<Snapshot>("/mark/tasks", file),
    [],
  );

  const exportTask = useCallback(async (tid: string, keepExcluded: boolean) => {
    const { blob, filename } = await collabDownload(
      `/mark/tasks/${tid}/export?keepExcluded=${keepExcluded}`,
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    fetchTaskStats,
    fetchTaskOps,
    fetchTaskList,
    fetchGlobalStats,
    uploadTask,
    exportTask,
  };
}
