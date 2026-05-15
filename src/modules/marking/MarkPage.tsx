// src/modules/marking/MarkPage.tsx
import { useMarking } from "./hooks/useMarking";
import Toolbar from "./components/Toolbar";
import UploadZone from "./components/UploadZone";
import FilterBar from "./components/FilterBar";
import RecordList from "./components/RecordList";
import Pagination from "./components/Pagination";
import CheckDialog from "./check/CheckDialog";
import { PublishButton } from "./publish/PublishButton";
import { Loader2 } from "lucide-react";

export default function MarkPage() {
  const mk = useMarking();
  const hasData = mk.records.length > 0;

  return (
    <div className="flex flex-col items-center p-4 md:p-6 w-full max-w-7xl mx-auto space-y-5">
      <Toolbar
        isCollab={mk.isCollab}
        collab={mk.collab}
        onModeChange={(v) => mk.setMode(v ? "collab" : "local")}
        layout={mk.layout}
        onLayoutChange={mk.setLayout}
        hasData={hasData}
        onCheck={mk.check.run}
        onReset={mk.reset}
        publishSlot={
          mk.isCollab && mk.collab.taskId ? (
            <PublishButton taskId={mk.collab.taskId} records={mk.records} includes={mk.includes} />
          ) : undefined
        }
      />

      <CheckDialog
        open={mk.check.open}
        onOpenChange={mk.check.setOpen}
        result={mk.check.result}
        onJump={mk.jumpToRecord}
      />

      {mk.isLoading && !hasData && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p>{mk.isCollab ? "正在同步协同任务..." : "正在解析文件..."}</p>
        </div>
      )}

      {!hasData && !mk.isLoading && !mk.isCollab && (
        <UploadZone fileRef={mk.fileRef} onFileChange={mk.loadFile} />
      )}
      {!hasData && !mk.isLoading && mk.isCollab && (
        <div className="text-center text-muted-foreground py-16 text-sm">暂无活跃的协同任务</div>
      )}

      {hasData && (
        <div className="w-full space-y-4">
          <FilterBar
            total={mk.records.length}
            included={mk.paging.includedN}
            blacklisted={mk.paging.blacklistedN}
            pending={mk.paging.pendingN}
            filter={mk.paging.filter}
            filteredCount={mk.paging.filteredN}
            onFilterChange={mk.paging.changeFilter}
            records={mk.records}
            includeEntries={mk.includes}
            blacklistedEntries={mk.blacklists}
            onJump={mk.jumpToRecord}
          />
          <RecordList
            layout={mk.layout}
            pagedData={mk.paging.data}
            pagedIndices={mk.paging.realIndices}
            includes={mk.includes}
            blacklists={mk.blacklists}
            attributions={mk.attributions}
            onToggleInclude={mk.actions.toggleInclude}
            onBlacklist={mk.actions.blacklist}
            onUnblacklist={mk.actions.unblacklist}
            onUpdateRecord={mk.actions.updateRecord}
            filter={mk.paging.filter}
            highlightIndex={mk.highlightIndex}
          />
          {mk.paging.totalPages > 1 && (
            <Pagination current={mk.paging.page} total={mk.paging.totalPages} onChange={mk.paging.changePage} />
          )}
        </div>
      )}
    </div>
  );
}
