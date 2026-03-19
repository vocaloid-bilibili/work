import { type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { FileDown, Search, LayoutGrid, LayoutList, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import TaskStatsPanel from "@/components/mark/TaskStatsPanel";
import type { LayoutMode } from "./useMarkState";

interface Props {
  isCollab: boolean;
  collab: any;
  mode: string;
  onModeChange: (checked: boolean) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  layoutMode: LayoutMode;
  onLayoutChange: (m: LayoutMode) => void;
  hasRecords: boolean;
  onOpenSearch: () => void;
  exportDialogOpen: boolean;
  onExportDialogChange: (v: boolean) => void;
  keepExcluded: boolean;
  onKeepExcludedChange: (v: boolean) => void;
  onExport: () => void;
}

export default function MarkToolbar({
  isCollab,
  collab,
  onModeChange,
  fileInputRef,
  onFileChange,
  layoutMode,
  onLayoutChange,
  hasRecords,
  onOpenSearch,
  exportDialogOpen,
  onExportDialogChange,
  keepExcluded,
  onKeepExcludedChange,
  onExport,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
      <div className="flex items-center space-x-2">
        <Switch
          id="collab-mode"
          checked={isCollab}
          onCheckedChange={onModeChange}
        />
        <Label htmlFor="collab-mode" className="text-sm">
          协同模式
        </Label>
        {isCollab && (
          <span className="text-[11px] text-muted-foreground">
            {collab.statusLabel} · 待同步 {collab.pendingCount}
          </span>
        )}
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls"
        onChange={onFileChange}
        className="max-w-xs cursor-pointer text-sm"
      />

      {hasRecords && (
        <div className="flex flex-wrap gap-2 items-center">
          {isCollab && (
            <TaskStatsPanel
              currentTaskId={collab.taskId}
              fetchTaskStats={collab.fetchTaskStats}
              fetchTaskList={collab.fetchTaskList}
            />
          )}

          {/* 布局切换 */}
          <div className="flex items-center border rounded-lg overflow-hidden md:flex">
            {[
              { mode: "list" as const, Icon: LayoutList, title: "单列列表" },
              { mode: "grid" as const, Icon: LayoutGrid, title: "双列网格" },
              { mode: "table" as const, Icon: Table2, title: "表格模式" },
            ].map(({ mode: m, Icon, title }, i) => (
              <Button
                key={m}
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-none",
                  i === 1 && "border-x",
                  layoutMode === m && "bg-muted",
                )}
                onClick={() => onLayoutChange(m)}
                title={title}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            className="justify-between text-muted-foreground sm:w-56"
            onClick={onOpenSearch}
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              搜索...
            </span>
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </Button>

          <Dialog open={exportDialogOpen} onOpenChange={onExportDialogChange}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileDown className="h-4 w-4" />
                导出
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>导出选项</DialogTitle>
                <DialogDescription>选择导出文件的内容</DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2 py-4">
                <Checkbox
                  id="keepExcluded"
                  checked={keepExcluded}
                  onCheckedChange={(c) => onKeepExcludedChange(c as boolean)}
                />
                <label htmlFor="keepExcluded" className="text-sm">
                  保留未收录的歌曲（标记为"排除"）
                </label>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => onExportDialogChange(false)}
                >
                  取消
                </Button>
                <Button onClick={onExport}>确认导出</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
