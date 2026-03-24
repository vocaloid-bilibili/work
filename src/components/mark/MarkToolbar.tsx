// src/components/mark/MarkToolbar.tsx
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileDown, LayoutGrid, LayoutList, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import TaskStatsPanel from "@/components/mark/TaskStatsPanel";
import { PublishButton } from "@/components/mark/publish";
import type { LayoutMode } from "./useMarkState";

interface Props {
  isCollab: boolean;
  collab: any;
  onModeChange: (checked: boolean) => void;
  layoutMode: LayoutMode;
  onLayoutChange: (m: LayoutMode) => void;
  hasRecords: boolean;
  onExport: () => void;
}

export default function MarkToolbar({
  isCollab,
  collab,
  onModeChange,
  layoutMode,
  onLayoutChange,
  hasRecords,
  onExport,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
      <div className="flex items-center space-x-2">
        <Switch
          id="collab-mode"
          checked={isCollab}
          onCheckedChange={onModeChange}
          className="data-[state=checked]:bg-emerald-600"
        />
        <Label htmlFor="collab-mode" className="text-sm">
          协同模式
        </Label>
        {isCollab && (
          <span className="text-[11px] text-muted-foreground">
            {collab.statusLabel}
          </span>
        )}
      </div>

      {hasRecords && (
        <div className="flex flex-wrap gap-2 items-center">
          {/* 布局切换 */}
          <div className="flex items-center border rounded-lg overflow-hidden">
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

          {/* 操作按钮组：统计、导出、发布 紧挨着 */}
          {isCollab && (
            <TaskStatsPanel
              currentTaskId={collab.taskId}
              fetchTaskStats={collab.fetchTaskStats}
              fetchTaskOps={collab.fetchTaskOps}
            />
          )}

          <Button variant="outline" className="gap-2" onClick={onExport}>
            <FileDown className="h-4 w-4" />
            导出
          </Button>

          {isCollab && <PublishButton taskId={collab.taskId} />}
        </div>
      )}
    </div>
  );
}
