import { useMarkState } from "./useMarkState";
import MarkToolbar from "./MarkToolbar";
import MarkOverviewBar from "./MarkOverviewBar";
import MarkRecordList from "./MarkRecordList";
import MarkPagination from "./MarkPagination";
import MarkBookmarkSheet from "./MarkBookmarkSheet";
import MarkSearchDialog from "./MarkSearchDialog";
import { ExportCheckDialog } from "./export-check";
import { Loader2 } from "lucide-react";

export default function MarkContent() {
  const s = useMarkState();
  const isTable = s.layoutMode === "table";

  return (
    <div className="flex flex-col items-center p-4 md:p-6 w-full max-w-7xl mx-auto space-y-5">
      <div className="flex justify-between w-full items-center">
        <MarkBookmarkSheet
          open={s.bookmarkOpen}
          onOpenChange={s.setBookmarkOpen}
          onJump={s.handleJumpToRecord}
        />
      </div>

      <MarkToolbar
        isCollab={s.isCollab}
        collab={s.collab}
        mode={s.mode}
        onModeChange={s.handleModeChange}
        fileInputRef={s.fileInputRef}
        onFileChange={s.handleFileChange}
        layoutMode={s.layoutMode}
        onLayoutChange={s.setLayoutMode}
        hasRecords={s.currentRecords.length > 0}
        onOpenSearch={() => s.setOpenSearch(true)}
        exportDialogOpen={s.exportDialogOpen}
        onExportDialogChange={s.setExportDialogOpen}
        keepExcluded={s.keepExcluded}
        onKeepExcludedChange={s.setKeepExcluded}
        onExport={s.handleExport}
      />

      <MarkSearchDialog
        open={s.openSearch}
        onOpenChange={s.setOpenSearch}
        records={s.currentRecords}
        onJump={s.handleJumpToRecord}
      />

      <ExportCheckDialog
        open={s.exportCheckOpen}
        onOpenChange={s.setExportCheckOpen}
        checkResult={s.exportCheckResult}
        onJump={s.handleJumpToRecord}
        onExport={s.performExport}
      />

      {s.isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p>{s.isCollab ? "正在同步协同任务..." : "正在解析文件..."}</p>
        </div>
      )}

      {s.currentRecords.length > 0 && (
        <div className="w-full space-y-4">
          <MarkOverviewBar
            total={s.currentRecords.length}
            included={s.includedCount}
            blacklisted={s.blacklistedCount}
            pending={s.pendingCount}
            allIncluded={s.allIncludedValue}
            onChangeAll={s.handleChangeAll}
          />

          <MarkRecordList
            layoutMode={s.layoutMode}
            pagedData={s.pagedData}
            allData={s.currentRecords}
            pageOffset={(s.currentPage - 1) * s.pageSize}
            includeEntries={s.currentIncludeEntries}
            blacklistedEntries={s.currentBlacklistedEntries}
            onIncludeChange={s.handleIncludeChange}
            onBlacklist={s.handleBlacklist}
            onUnblacklist={s.handleUnblacklist}
            onRecordUpdate={s.handleRecordUpdate}
            onDirectFieldChange={s.handleDirectFieldChange}
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
