// src/modules/editor/log/useLogPager.ts
import { useState, useEffect, useCallback } from "react";
import { getEditLogs, type PagedEditLogs } from "@/core/api/collabEndpoints";

const SIZE = 20;

export function useLogPager() {
  const [data, setData] = useState<PagedEditLogs | null>(null);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [target, setTarget] = useState("all");
  const [search, setSearch] = useState("");
  const [syncCursor, setSyncCursor] = useState<number | null>(null);

  const pages = data ? Math.max(1, Math.ceil(data.total / SIZE)) : 1;
  const page = Math.floor(offset / SIZE) + 1;
  const hasFilters = target !== "all" || search !== "";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getEditLogs({
        limit: SIZE,
        offset,
        targetType: target !== "all" ? target : undefined,
        userId: search || undefined,
      });
      setData(r);
    } catch (e) {
      console.error("[log]", e);
    } finally {
      setLoading(false);
    }
  }, [offset, target, search]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    page,
    pages,
    syncCursor,
    setSyncCursor,
    target,
    setTarget: (v: string) => {
      setTarget(v);
      setOffset(0);
    },
    search,
    setSearch,
    applySearch: (q: string) => {
      setSearch(q);
      setOffset(0);
    },
    hasFilters,
    reset: () => {
      setTarget("all");
      setSearch("");
      setOffset(0);
    },
    prev: () => setOffset((p) => Math.max(0, p - SIZE)),
    next: () => setOffset((p) => p + SIZE),
    refresh: load,
  };
}
