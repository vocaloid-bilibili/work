// src/modules/editor/log/LogFilters.tsx
import { useState } from "react";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/ui/cn";
import { TARGET_FILTERS } from "./constants";

interface Props {
  target: string;
  hasFilters: boolean;
  onTarget: (v: string) => void;
  onSearch: (q: string) => void;
  onReset: () => void;
}

export default function LogFilters({
  target,
  hasFilters,
  onTarget,
  onSearch,
  onReset,
}: Props) {
  const [q, setQ] = useState("");

  const submit = () => {
    onSearch(q.trim());
  };

  return (
    <div className="space-y-2">
      {/* 搜索 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="h-8 text-xs pl-8"
            placeholder="搜索用户 ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs gap-1"
            onClick={() => {
              setQ("");
              onReset();
            }}
          >
            <X className="h-3 w-3" />
            清除
          </Button>
        )}
      </div>

      {/* 快筛 chips */}
      <div className="flex gap-1.5 flex-wrap">
        {TARGET_FILTERS.map((f) => (
          <button
            key={f.value}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
              target === f.value
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
            onClick={() => onTarget(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
