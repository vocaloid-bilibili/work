// src/modules/editor/log/index.tsx

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { getEditLogs, type PagedEditLogs } from "@/core/api/collabEndpoints";
import LogFilters from "./LogFilters";
import LogItem from "./LogItem";
import SyncBar from "./SyncBar";

const PAGE_SIZE = 20;

export default function EditLogViewer() {
  const [data, setData] = useState<PagedEditLogs | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [filterAction, setFilterAction] = useState("all");
  const [filterTargetType, setFilterTargetType] = useState("all");
  const [searchUserId, setSearchUserId] = useState("");
  const [appliedUserId, setAppliedUserId] = useState("");
  const [syncCursor, setSyncCursor] = useState<number | null>(null);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const currentPage = Math.floor(page / PAGE_SIZE) + 1;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getEditLogs({
        limit: PAGE_SIZE,
        offset: page,
        action: filterAction !== "all" ? filterAction : undefined,
        targetType: filterTargetType !== "all" ? filterTargetType : undefined,
        userId: appliedUserId || undefined,
      });
      setData(result);
    } catch (e) {
      console.error("[EditLogViewer] 加载失败", e);
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterTargetType, appliedUserId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const hasFilters =
    filterAction !== "all" ||
    filterTargetType !== "all" ||
    appliedUserId !== "";

  const resetFilters = () => {
    setFilterAction("all");
    setFilterTargetType("all");
    setSearchUserId("");
    setAppliedUserId("");
    setPage(0);
  };

  const handleCursorLoaded = useCallback((cursor: number) => {
    setSyncCursor(cursor);
  }, []);

  return (
    <div className="p-3 sm:p-5 max-w-3xl mx-auto space-y-4">
      <LogFilters
        filterAction={filterAction}
        filterTargetType={filterTargetType}
        searchUserId={searchUserId}
        hasFilters={hasFilters}
        onFilterAction={(v) => {
          setFilterAction(v);
          setPage(0);
        }}
        onFilterTargetType={(v) => {
          setFilterTargetType(v);
          setPage(0);
        }}
        onSearchUserId={setSearchUserId}
        onApplyUserId={() => {
          setAppliedUserId(searchUserId.trim());
          setPage(0);
        }}
        onReset={resetFilters}
      />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            {data ? (
              <>
                共{" "}
                <span className="font-medium text-foreground">
                  {data.total}
                </span>{" "}
                条记录
              </>
            ) : (
              "加载中…"
            )}
          </div>
          <SyncBar onCursorLoaded={handleCursorLoaded} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchLogs}
          disabled={loading}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`}
          />
          刷新
        </Button>
      </div>

      <div className="space-y-2">
        {loading && !data && (
          <div className="text-center text-muted-foreground py-12">加载中…</div>
        )}

        {data && data.logs.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            暂无操作日志
          </div>
        )}

        {data?.logs.map((log) => (
          <LogItem key={log.logId} log={log} syncCursor={syncCursor} />
        ))}
      </div>

      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - PAGE_SIZE))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!data.hasMore}
            onClick={() => setPage((p) => p + PAGE_SIZE)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
