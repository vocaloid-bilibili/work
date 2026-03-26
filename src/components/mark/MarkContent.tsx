// src/components/mark/MarkContent.tsx

import { useMarkState } from "./useMarkState";
import MarkToolbar from "./MarkToolbar";
import MarkUploadArea from "./MarkUploadArea";
import MarkOverviewBar from "./MarkOverviewBar";
import MarkRecordList from "./MarkRecordList";
import MarkPagination from "./MarkPagination";
import { ExportCheckDialog } from "./export-check";
import { Loader2 } from "lucide-react";

export default function MarkContent() {
  const s = useMarkState();
  const isTable = s.layoutMode === "table";
  const hasRecords = s.currentRecords.length > 0;

  return (
    <div className="flex flex-col items-center p-4 md:p-6 w-full max-w-7xl mx-auto space-y-5">
      <MarkToolbar
        isCollab={s.isCollab}
        collab={s.collab}
        onModeChange={s.handleModeChange}
        layoutMode={s.layoutMode}
        onLayoutChange={s.setLayoutMode}
        hasRecords={hasRecords}
        onExport={s.handleExport}
      />

      <ExportCheckDialog
        open={s.exportCheckOpen}
        onOpenChange={s.setExportCheckOpen}
        checkResult={s.exportCheckResult}
        onJump={s.handleJumpToRecord}
        onExport={s.performExport}
      />

      {/* 加载中 */}
      {s.isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p>{s.isCollab ? "正在同步协同任务..." : "正在解析文件..."}</p>
        </div>
      )}

      {!hasRecords && !s.isLoading && !s.isCollab && (
        <MarkUploadArea
          fileInputRef={s.fileInputRef}
          onFileChange={s.handleFileChange}
        />
      )}

      {!hasRecords && !s.isLoading && s.isCollab && (
        <div className="text-center text-muted-foreground py-16 text-sm">
          暂无活跃的协同任务
        </div>
      )}

      {hasRecords && (
        <div className="w-full space-y-4">
          <MarkOverviewBar
            total={s.currentRecords.length}
            included={s.includedCount}
            blacklisted={s.blacklistedCount}
            pending={s.pendingCount}
            filter={s.filter}
            filteredCount={s.filteredCount}
            onFilterChange={s.handleFilterChange}
            records={s.currentRecords}
            includeEntries={s.currentIncludeEntries}
            blacklistedEntries={s.currentBlacklistedEntries}
            onJump={s.handleJumpToRecord}
          />

          <MarkRecordList
            layoutMode={s.layoutMode}
            pagedData={s.pagedData}
            pagedRealIndices={s.pagedRealIndices}
            allData={s.currentRecords}
            includeEntries={s.currentIncludeEntries}
            blacklistedEntries={s.currentBlacklistedEntries}
            recordAttributions={s.currentRecordAttributions}
            onIncludeChange={s.handleIncludeChange}
            onBlacklist={s.handleBlacklist}
            onUnblacklist={s.handleUnblacklist}
            onRecordUpdate={s.handleRecordUpdate}
            onDirectFieldChange={s.handleDirectFieldChange}
            filter={s.filter}
          />

          {!isTable && s.totalPages > 1 && (
            <MarkPagination
              currentPage={s.currentPage}
              totalPages={s.totalPages}
              onPageChange={s.handlePageChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
