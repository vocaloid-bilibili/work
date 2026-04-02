// src/modules/marking/collab/useCollabOps.ts
import { useCallback, useRef } from "react";
import type { MarkOp, MarkAction, Row } from "@/core/types/collab";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `op-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

export function applyOp(
  op: Pick<MarkOp, "action" | "recordIndex" | "field" | "value">,
  recs: Row[],
  inc: boolean[],
  bl: boolean[],
) {
  const i = op.recordIndex;
  if (i < 0 || i >= recs.length) return { recs, inc, bl };
  switch (op.action) {
    case "toggle_include": {
      const n = [...inc];
      n[i] = Boolean(op.value);
      return { recs, inc: n, bl };
    }
    case "blacklist": {
      const ni = [...inc];
      const nb = [...bl];
      nb[i] = true;
      ni[i] = false;
      return { recs, inc: ni, bl: nb };
    }
    case "unblacklist": {
      const nb = [...bl];
      nb[i] = false;
      return { recs, inc, bl: nb };
    }
    case "set": {
      const nr = [...recs];
      nr[i] = { ...recs[i], [op.field]: op.value };
      return { recs: nr, inc, bl };
    }
  }
  return { recs, inc, bl };
}

interface Refs {
  taskIdRef: React.MutableRefObject<string | null>;
  versionRef: React.MutableRefObject<number>;
  recordsRef: React.MutableRefObject<Row[]>;
  includesRef: React.MutableRefObject<boolean[]>;
  blacklistsRef: React.MutableRefObject<boolean[]>;
  send: (data: Record<string, unknown>) => void;
}

interface StateSetters {
  setRecords: React.Dispatch<React.SetStateAction<Row[]>>;
  setIncludes: React.Dispatch<React.SetStateAction<boolean[]>>;
  setBlacklists: React.Dispatch<React.SetStateAction<boolean[]>>;
}

function commit(
  result: ReturnType<typeof applyOp>,
  refs: Refs,
  s: StateSetters,
) {
  if (result.recs !== refs.recordsRef.current) {
    refs.recordsRef.current = result.recs;
    s.setRecords(result.recs);
  }
  if (result.inc !== refs.includesRef.current) {
    refs.includesRef.current = result.inc;
    s.setIncludes(result.inc);
  }
  if (result.bl !== refs.blacklistsRef.current) {
    refs.blacklistsRef.current = result.bl;
    s.setBlacklists(result.bl);
  }
}

export function useCollabOps(refs: Refs, setters: StateSetters) {
  const pendingRef = useRef<Set<string>>(new Set());

  const refsRef = useRef(refs);
  refsRef.current = refs;
  const settersRef = useRef(setters);
  settersRef.current = setters;

  const submit = useCallback(
    (input: {
      recordIndex: number;
      field: string;
      action: MarkAction;
      value: unknown;
    }) => {
      const r = refsRef.current;
      const s = settersRef.current;
      if (!r.taskIdRef.current) return;
      const op: MarkOp = {
        opId: uid(),
        taskId: r.taskIdRef.current,
        recordIndex: input.recordIndex,
        field: input.field,
        action: input.action,
        value: input.value,
        baseVersion: r.versionRef.current,
        clientTime: new Date().toISOString(),
      };
      r.versionRef.current += 1;
      const result = applyOp(
        op,
        r.recordsRef.current,
        r.includesRef.current,
        r.blacklistsRef.current,
      );
      commit(result, r, s);
      pendingRef.current.add(op.opId);
      r.send({ type: "submit_operation", operation: op });
    },
    [],
  );

  const updateField = useCallback(
    (i: number, f: string, v: unknown) =>
      submit({ recordIndex: i, field: f, action: "set", value: v }),
    [submit],
  );
  const toggleInclude = useCallback(
    (i: number, v: boolean) =>
      submit({
        recordIndex: i,
        field: "include",
        action: "toggle_include",
        value: v,
      }),
    [submit],
  );
  const blacklistRecord = useCallback(
    (i: number) =>
      submit({
        recordIndex: i,
        field: "blacklist",
        action: "blacklist",
        value: true,
      }),
    [submit],
  );
  const unblacklistRecord = useCallback(
    (i: number) =>
      submit({
        recordIndex: i,
        field: "blacklist",
        action: "unblacklist",
        value: false,
      }),
    [submit],
  );

  const handleCommitted = useCallback((op: MarkOp, version: number) => {
    const r = refsRef.current;
    const s = settersRef.current;
    const result = applyOp(
      op,
      r.recordsRef.current,
      r.includesRef.current,
      r.blacklistsRef.current,
    );
    commit(result, r, s);
    r.versionRef.current = Math.max(r.versionRef.current, version);
    pendingRef.current.delete(op.opId);
  }, []);

  const handleConflict = useCallback(
    (opId: string, currentVersion?: number) => {
      pendingRef.current.delete(opId);
      if (typeof currentVersion === "number")
        refsRef.current.versionRef.current = currentVersion;
    },
    [],
  );

  const clearPending = useCallback(() => pendingRef.current.clear(), []);

  return {
    submit,
    updateField,
    toggleInclude,
    blacklistRecord,
    unblacklistRecord,
    handleCommitted,
    handleConflict,
    clearPending,
    pendingRef,
  };
}
