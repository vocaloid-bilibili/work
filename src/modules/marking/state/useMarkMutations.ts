// src/modules/marking/state/useMarkMutations.ts
import { useCallback, useRef } from "react";
import { filled } from "@/core/helpers/sanitize";
import type { Row } from "@/core/types/collab";

interface Opts {
  isCollab: boolean;
  collab: {
    toggleInclude: (i: number, v: boolean) => void;
    blacklistRecord: (i: number) => void;
    unblacklistRecord: (i: number) => void;
    updateField: (i: number, f: string, v: unknown) => void;
    updateLocalRecord: (i: number, fn: (r: Row) => Row) => void;
  };
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

export function useMarkMutations({
  isCollab,
  collab,
  records,
  setRecords,
  includes,
  setIncludes,
  blacklists,
  setBlacklists,
}: Opts) {
  const recordsRef = useRef(records);
  recordsRef.current = records;

  const toggleInclude = useCallback(
    (i: number, v: boolean) => {
      if (isCollab) {
        collab.toggleInclude(i, v);
        return;
      }
      setIncludes((p) => {
        const n = [...p];
        n[i] = v;
        return n;
      });
    },
    [isCollab, collab, setIncludes],
  );

  const blacklist = useCallback(
    (i: number) => {
      if (isCollab) {
        collab.blacklistRecord(i);
        return;
      }
      setBlacklists((p) => {
        const n = [...p];
        n[i] = true;
        return n;
      });
      setIncludes((p) => {
        const n = [...p];
        n[i] = false;
        return n;
      });
    },
    [isCollab, collab, setBlacklists, setIncludes],
  );

  const unblacklist = useCallback(
    (i: number) => {
      if (isCollab) {
        collab.unblacklistRecord(i);
        return;
      }
      setBlacklists((p) => {
        const n = [...p];
        n[i] = false;
        return n;
      });
    },
    [isCollab, collab, setBlacklists],
  );

  const bulkInclude = useCallback(
    (indices: number[]) => {
      for (const i of indices) {
        if (!blacklists[i]) toggleInclude(i, true);
      }
    },
    [blacklists, toggleInclude],
  );

  const bulkBlacklist = useCallback(
    (indices: number[]) => {
      for (const i of indices) {
        if (!blacklists[i] && !includes[i]) blacklist(i);
      }
    },
    [blacklists, includes, blacklist],
  );

  const updateRecord = useCallback(
    (index: number, updater: any) => {
      if (isCollab) {
        const current = recordsRef.current[index];
        const next = typeof updater === "function" ? updater(current) : updater;
        if (!next || typeof next !== "object") return;
        const changed = Object.entries(next).filter(
          ([f, v]) => current[f] !== v,
        );
        if (!changed.length) return;
        const local = changed.filter(([f]) => f.startsWith("_unconfirmed_"));
        if (local.length) {
          collab.updateLocalRecord(index, (row) => {
            const n = { ...row };
            for (const [f, v] of local) n[f] = v;
            return n;
          });
        }
        changed
          .filter(([f]) => !f.startsWith("_unconfirmed_"))
          .forEach(([f, v]) => collab.updateField(index, f, v));
        return;
      }
      setRecords((prev) => {
        const n = [...prev];
        const obj =
          typeof updater === "function" ? updater(prev[index]) : updater;
        if (n[index] === obj) return prev;
        n[index] = obj;
        return n;
      });
      setIncludes((prev) => {
        const n = [...prev];
        const currentRec = recordsRef.current[index];
        const merged =
          typeof updater === "function"
            ? updater(currentRec)
            : { ...currentRec, ...updater };
        n[index] = autoInclude(merged);
        return n;
      });
    },
    [isCollab, collab, setRecords, setIncludes],
  );

  const setField = useCallback(
    (i: number, field: string, value: unknown) => {
      if (isCollab) {
        collab.updateField(i, field, value);
        return;
      }
      setRecords((prev) => {
        const n = [...prev];
        n[i] = { ...n[i], [field]: value };
        return n;
      });
      if (["vocal", "synthesizer", "type"].includes(field)) {
        setIncludes((prev) => {
          const n = [...prev];
          const r = { ...recordsRef.current[i], [field]: value };
          n[i] = autoInclude(r);
          return n;
        });
      }
    },
    [isCollab, collab, setRecords, setIncludes],
  );

  return {
    toggleInclude,
    blacklist,
    unblacklist,
    bulkInclude,
    bulkBlacklist,
    updateRecord,
    setField,
  };
}
