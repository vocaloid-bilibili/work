// src/modules/marking/hooks/useMarkCheck.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { CheckResult } from "../check/types";
import type { Row } from "@/core/types/collab";

const EMPTY: CheckResult = {
  pending: [],
  missingFields: [],
  nameMatchTitle: [],
  authorMatchUp: [],
  sameAuthorDiffName: [],
  inconsistentEntries: [],
};

interface MarkCheckOpts {
  records: Row[];
  includes: boolean[];
  blacklists: boolean[];
}

export function useMarkCheck({ records, includes, blacklists }: MarkCheckOpts) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<CheckResult>(EMPTY);

  const run = useCallback(() => {
    if (records.length === 0) {
      toast.error("没有数据");
      return;
    }
    import("../check/runChecks").then((m) => {
      setResult(m.runChecks(records, includes, blacklists));
      setOpen(true);
    });
  }, [records, includes, blacklists]);

  return { open, setOpen, result, run };
}
