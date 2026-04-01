// src/modules/editor/log/LogFilters.tsx

import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Card, CardContent } from "@/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Search, Filter, X } from "lucide-react";
import { ACTION_LABELS, TARGET_LABELS } from "./constants";

interface LogFiltersProps {
  filterAction: string;
  filterTargetType: string;
  searchUserId: string;
  hasFilters: boolean;
  onFilterAction: (v: string) => void;
  onFilterTargetType: (v: string) => void;
  onSearchUserId: (v: string) => void;
  onApplyUserId: () => void;
  onReset: () => void;
}

export default function LogFilters({
  filterAction,
  filterTargetType,
  searchUserId,
  hasFilters,
  onFilterAction,
  onFilterTargetType,
  onSearchUserId,
  onApplyUserId,
  onReset,
}: LogFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" />
          筛选
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onReset}
            >
              <X className="h-3 w-3 mr-1" />
              清除
            </Button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">操作类型</Label>
            <Select value={filterAction} onValueChange={onFilterAction}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {Object.entries(ACTION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">目标类型</Label>
            <Select value={filterTargetType} onValueChange={onFilterTargetType}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {Object.entries(TARGET_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">用户 ID</Label>
            <div className="flex gap-1">
              <Input
                className="h-8 text-xs"
                placeholder="输入用户 ID"
                value={searchUserId}
                onChange={(e) => onSearchUserId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onApplyUserId()}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={onApplyUserId}
              >
                <Search className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
