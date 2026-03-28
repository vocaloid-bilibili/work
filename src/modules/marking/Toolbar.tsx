// src/modules/marking/Toolbar.tsx
import { useNavigate } from "react-router-dom";
import { Button } from "@/ui/button";
import { Switch } from "@/ui/switch";
import { Label } from "@/ui/label";
import {
  FileDown,
  LayoutGrid,
  LayoutList,
  Table2,
  X,
  BarChart3,
} from "lucide-react";
import { cn } from "@/ui/cn";
import { PublishButton } from "./publish/PublishButton";
import type { LayoutMode } from "./state/useMarkCore";

interface P {
  isCollab: boolean;
  collab: any;
  onModeChange: (v: boolean) => void;
  layout: LayoutMode;
  onLayoutChange: (m: LayoutMode) => void;
  hasData: boolean;
  onExport: () => void;
  onReset?: () => void;
}

export default function Toolbar({
  isCollab,
  collab,
  onModeChange,
  layout,
  onLayoutChange,
  hasData,
  onExport,
  onReset,
}: P) {
  const nav = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
      <div className="flex items-center space-x-2">
        <Switch
          id="collab"
          checked={isCollab}
          onCheckedChange={onModeChange}
          className="data-[state=checked]:bg-emerald-600"
        />
        <Label htmlFor="collab" className="text-sm">
          协同模式
        </Label>
        {isCollab && (
          <span className="text-[11px] text-muted-foreground">
            {collab.statusLabel}
          </span>
        )}
      </div>
      {hasData && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center border rounded-lg overflow-hidden">
            {(
              [
                ["list", LayoutList, "单列"],
                ["grid", LayoutGrid, "双列"],
                ["table", Table2, "表格"],
              ] as const
            ).map(([m, Icon, t], i) => (
              <Button
                key={m}
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-none",
                  i === 1 && "border-x",
                  layout === m && "bg-muted",
                )}
                onClick={() => onLayoutChange(m)}
                title={t}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
          {isCollab && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => nav("/stats")}
            >
              <BarChart3 className="h-4 w-4" />
              统计
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={onExport}>
            <FileDown className="h-4 w-4" />
            导出
          </Button>
          {isCollab && <PublishButton taskId={collab.taskId} />}
          {!isCollab && onReset && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onReset}
              title="关闭"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
