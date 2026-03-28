// src/modules/marking/collab/useCollabSnapshot.ts
import { useCallback, useRef } from "react";
import { collabGet } from "@/core/api/collabClient";
import { sanitizeRow } from "@/core/helpers/sanitize";
import type { Snapshot, Row } from "@/core/types/collab";
import type { Attribution } from "@/core/types/stats";

interface Setters {
  setTaskId: (id: string | null) => void;
  setVersion: (v: number) => void;
  setRecords: (r: Row[]) => void;
  setIncludes: (b: boolean[]) => void;
  setBlacklists: (b: boolean[]) => void;
  setAttributions: (a: Attribution[]) => void;
}

export function useCollabSnapshot(setters: Setters) {
  const taskIdRef = useRef<string | null>(null);
  const versionRef = useRef(0);
  const recordsRef = useRef<Row[]>([]);
  const includesRef = useRef<boolean[]>([]);
  const blacklistsRef = useRef<boolean[]>([]);

  const apply = useCallback(
    (snap: Snapshot) => {
      const recs = snap.records.map(sanitizeRow);
      const inc = snap.includeEntries;
      const bl = snap.blacklistedEntries || new Array(recs.length).fill(false);

      taskIdRef.current = snap.taskId;
      versionRef.current = snap.version;
      recordsRef.current = recs;
      includesRef.current = inc;
      blacklistsRef.current = bl;

      setters.setTaskId(snap.taskId);
      setters.setVersion(snap.version);
      setters.setRecords(recs);
      setters.setIncludes(inc);
      setters.setBlacklists(bl);
      setters.setAttributions(
        snap.recordAttributions || new Array(recs.length).fill({}),
      );
    },
    [setters],
  );

  const load = useCallback(
    async (tid: string) => {
      const snap = await collabGet<Snapshot>(`/mark/tasks/${tid}/snapshot`);
      apply(snap);
    },
    [apply],
  );

  return {
    apply,
    load,
    taskIdRef,
    versionRef,
    recordsRef,
    includesRef,
    blacklistsRef,
  };
}
