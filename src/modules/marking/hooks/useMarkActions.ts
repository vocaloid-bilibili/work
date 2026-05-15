// src/modules/marking/hooks/useMarkActions.ts
import { useCallback, useEffect, useMemo, useRef } from "react";
import { filled } from "@/core/helpers/sanitize";
import type { Row } from "@/core/types/collab";


interface ActionBackend {
  toggleInclude: (i: number, v: boolean) => void;
  blacklist: (i: number) => void;
  unblacklist: (i: number) => void;
  updateField: (i: number, field: string, value: unknown) => void;
  updateLocalRecord: (i: number, fn: (r: Row) => Row) => void;
}

interface CollabActions {
  toggleInclude: (i: number, v: boolean) => void;
  blacklistRecord: (i: number) => void;
  unblacklistRecord: (i: number) => void;
  updateField: (i: number, f: string, v: unknown) => void;
  updateLocalRecord: (i: number, fn: (r: Row) => Row) => void;
}

interface MarkActionsOpts {
  isCollab: boolean;
  collab: CollabActions;
  records: Row[];
  setRecords: React.Dispatch<React.SetStateAction<Row[]>>;
  includes: boolean[];
  setIncludes: React.Dispatch<React.SetStateAction<boolean[]>>;
  blacklists: boolean[];
  setBlacklists: React.Dispatch<React.SetStateAction<boolean[]>>;
}

function autoInclude(r: Row) {
  return filled(r.vocal) && filled(r.synthesizer) && filled(r.type);
}

export function useMarkActions({
  isCollab,
  collab,
  records,
  setRecords,
  includes,
  setIncludes,
  blacklists,
  setBlacklists,
}: MarkActionsOpts) {
  const recordsRef = useRef(records);
  useEffect(() => { recordsRef.current = records; }, [records]);

  const backend = useMemo<ActionBackend>(() => {
    if (isCollab) {
      return {
        toggleInclude: collab.toggleInclude,
        blacklist: collab.blacklistRecord,
        unblacklist: collab.unblacklistRecord,
        updateField: collab.updateField,
        updateLocalRecord: collab.updateLocalRecord,
      };
    }
    return {
      toggleInclude: (i, v) =>
        setIncludes((prev) => { const n = [...prev]; n[i] = v; return n; }),
      blacklist: (i) => {
        setBlacklists((prev) => { const n = [...prev]; n[i] = true; return n; });
        setIncludes((prev) => { const n = [...prev]; n[i] = false; return n; });
      },
      unblacklist: (i) =>
        setBlacklists((prev) => { const n = [...prev]; n[i] = false; return n; }),
      updateField: (i, field, value) => {
        setRecords((prev) => { const n = [...prev]; n[i] = { ...n[i], [field]: value }; return n; });
        if (["vocal", "synthesizer", "type"].includes(field)) {
          setIncludes((prev) => {
            const n = [...prev];
            n[i] = autoInclude({ ...recordsRef.current[i], [field]: value });
            return n;
          });
        }
      },
      updateLocalRecord: (i, fn) =>
        setRecords((prev) => { const n = [...prev]; n[i] = fn(prev[i]); return n; }),
    };
  }, [isCollab, collab, setRecords, setIncludes, setBlacklists]);

  const toggleInclude = useCallback(
    (i: number, v: boolean) => backend.toggleInclude(i, v),
    [backend],
  );

  const blacklist = useCallback(
    (i: number) => backend.blacklist(i),
    [backend],
  );

  const unblacklist = useCallback(
    (i: number) => backend.unblacklist(i),
    [backend],
  );

  const updateRecord = useCallback(
    (index: number, updater: Row | ((prev: Row) => Row)) => {
      const current = recordsRef.current[index];
      const next = typeof updater === "function" ? updater(current) : updater;
      if (!next || typeof next !== "object" || next === current) return;

      const changed = Object.entries(next).filter(([f, v]) => current[f] !== v);
      if (!changed.length) return;

      const local = changed.filter(([f]) => f.startsWith("_unconfirmed_"));
      const remote = changed.filter(([f]) => !f.startsWith("_unconfirmed_"));

      if (local.length) {
        backend.updateLocalRecord(index, (row) => {
          const n = { ...row };
          for (const [f, v] of local) n[f] = v;
          return n;
        });
      }

      if (isCollab) {
        remote.forEach(([f, v]) => backend.updateField(index, f, v));
      } else if (remote.length) {
        setRecords((prev) => { const n = [...prev]; n[index] = next; return n; });
        setIncludes((prev) => { const n = [...prev]; n[index] = autoInclude(next); return n; });
      }
    },
    [isCollab, backend, setRecords, setIncludes],
  );

  const setField = useCallback(
    (i: number, field: string, value: unknown) => backend.updateField(i, field, value),
    [backend],
  );

  return { toggleInclude, blacklist, unblacklist, updateRecord, setField };
}
