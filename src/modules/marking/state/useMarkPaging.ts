// src/modules/marking/state/useMarkPaging.ts
import { useState, useMemo, useCallback } from "react";

export type Filter = "included" | "blacklisted" | "pending" | null;

interface Opts {
  records: unknown[];
  includes: boolean[];
  blacklists: boolean[];
  pageSize: number;
}

export function useMarkPaging({
  records,
  includes,
  blacklists,
  pageSize,
}: Opts) {
  const [filter, setFilter] = useState<Filter>(null);
  const [page, setPage] = useState(1);

  const includedN = includes.filter(Boolean).length;
  const blacklistedN = blacklists.filter(Boolean).length;
  const pendingN = useMemo(
    () =>
      records.reduce<number>(
        (s, _, i) => s + (!includes[i] && !blacklists[i] ? 1 : 0),
        0,
      ),
    [records, includes, blacklists],
  );

  const indices = useMemo(() => {
    if (!filter) return null;
    const out: number[] = [];
    for (let i = 0; i < records.length; i++) {
      if (i >= includes.length || i >= blacklists.length) continue;
      if (filter === "included" && includes[i]) out.push(i);
      else if (filter === "blacklisted" && blacklists[i]) out.push(i);
      else if (filter === "pending" && !includes[i] && !blacklists[i])
        out.push(i);
    }
    return out;
  }, [filter, records, includes, blacklists]);

  const filteredN = indices ? indices.length : records.length;
  const totalPages = Math.max(1, Math.ceil(filteredN / pageSize));

  const safePage = Math.min(page, totalPages);

  const { data, realIndices } = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    if (!indices) {
      const d = records.slice(start, start + pageSize);
      return {
        data: d,
        realIndices: Array.from({ length: d.length }, (_, i) => start + i),
      };
    }
    const pi = indices.slice(start, start + pageSize);
    const validPi = pi.filter((i) => i >= 0 && i < records.length);
    return { data: validPi.map((i) => records[i]), realIndices: validPi };
  }, [records, safePage, pageSize, indices]);

  const changeFilter = useCallback((f: Filter) => {
    setFilter(f);
    setPage(1);
  }, []);
  const changePage = useCallback(
    (p: number) => {
      if (p >= 1 && p <= totalPages) {
        setPage(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [totalPages],
  );

  return {
    filter,
    page: safePage,
    totalPages,
    filteredN,
    includedN,
    blacklistedN,
    pendingN,
    data,
    realIndices,
    indices,
    setPage,
    changeFilter,
    changePage,
  };
}
