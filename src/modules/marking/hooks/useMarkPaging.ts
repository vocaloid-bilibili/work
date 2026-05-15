// src/modules/marking/hooks/useMarkPaging.ts
import { useState, useMemo, useCallback } from "react";

export type Filter = "included" | "blacklisted" | "pending" | null;

interface MarkPagingOpts<T> {
  records: T[];
  includes: boolean[];
  blacklists: boolean[];
  pageSize: number;
}

export function useMarkPaging<T>({
  records,
  includes,
  blacklists,
  pageSize,
}: MarkPagingOpts<T>) {
  const [filter, setFilter] = useState<Filter>(null);
  const [page, setPage] = useState(1);

  const includedN = includes.filter(Boolean).length;
  const blacklistedN = blacklists.filter(Boolean).length;
  const pendingN = useMemo(
    () =>
      records.reduce<number>(
        (sum, _, i) => sum + (!includes[i] && !blacklists[i] ? 1 : 0),
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
      const slice = records.slice(start, start + pageSize);
      return {
        data: slice,
        realIndices: Array.from({ length: slice.length }, (_, i) => start + i),
      };
    }
    const pageIndices = indices
      .slice(start, start + pageSize)
      .filter((i) => i >= 0 && i < records.length);
    return {
      data: pageIndices.map((i) => records[i]),
      realIndices: pageIndices,
    };
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
