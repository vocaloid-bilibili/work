// src/modules/marking/MarkPage.tsx
import { useMarkOrchestrator } from "./state/useMarkOrchestrator";
import Toolbar from "./Toolbar";
import UploadZone from "./UploadZone";
import FilterBar from "./FilterBar";
import RecordList from "./RecordList";
import Pagination from "./Pagination";
import CheckDialog from "./check/CheckDialog";
import { Loader2 } from "lucide-react";

export default function MarkPage() {
  const s = useMarkOrchestrator();
  const hasData = s.records.length > 0;

  return (
    <div className="flex flex-col items-center p-4 md:p-6 w-full max-w-7xl mx-auto space-y-5">
      <Toolbar
        isCollab={s.isCollab}
        collab={s.collab}
        onModeChange={(v) => s.setMode(v ? "collab" : "local")}
        layout={s.layout}
        onLayoutChange={s.setLayout}
        hasData={hasData}
        onExport={s.tryExport}
        onReset={s.reset}
      />
      <CheckDialog
        open={s.checkOpen}
        onOpenChange={s.setCheckOpen}
        result={s.checkResult}
        onJump={s.jumpToRecord}
        onExport={s.doExport}
      />

      {s.isLoading && !hasData && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p>{s.isCollab ? "正在同步协同任务..." : "正在解析文件..."}</p>
        </div>
      )}

      {!hasData && !s.isLoading && !s.isCollab && (
        <UploadZone fileRef={s.fileRef} onFileChange={s.loadFile} />
      )}
      {!hasData && !s.isLoading && s.isCollab && (
        <div className="text-center text-muted-foreground py-16 text-sm">
          暂无活跃的协同任务
        </div>
      )}

      {hasData && (
        <div className="w-full space-y-4">
          <FilterBar
            total={s.records.length}
            included={s.includedN}
            blacklisted={s.blacklistedN}
            pending={s.pendingN}
            filter={s.filter}
            filteredCount={s.filteredN}
            onFilterChange={s.changeFilter}
            records={s.records}
            includeEntries={s.includes}
            blacklistedEntries={s.blacklists}
            onJump={s.jumpToRecord}
          />
          <RecordList
            layout={s.layout}
            pagedData={s.data}
            pagedIndices={s.realIndices}
            allData={s.records}
            includes={s.includes}
            blacklists={s.blacklists}
            attributions={s.attributions}
            onInclude={s.toggleInclude}
            onBlacklist={s.blacklist}
            onUnblacklist={s.unblacklist}
            onRecordUpdate={s.updateRecord}
            onFieldChange={s.setField}
            filter={s.filter}
            highlightIndex={s.highlightIndex}
            filteredIndices={s.indices}
          />
          {s.layout !== "table" && s.totalPages > 1 && (
            <Pagination
              current={s.page}
              total={s.totalPages}
              onChange={s.changePage}
            />
          )}
        </div>
      )}
    </div>
  );
}
