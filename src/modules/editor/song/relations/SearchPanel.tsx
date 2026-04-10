// src/modules/editor/song/relations/SearchPanel.tsx
import { Check, Loader2, Plus, Search, X } from "lucide-react";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import type { Song } from "@/core/types/catalog";

const TYPE_BADGE: Record<string, string> = {
  翻唱: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  原创: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  本家重置: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  串烧: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

interface Props {
  addMode: "original" | "derivative";
  searchInput: string;
  onSearchChange: (v: string) => void;
  searching: boolean;
  submitting: boolean;
  filteredResults: Song[];
  selected: Map<number, Song>;
  onResultClick: (s: Song) => void;
  onToggleSelect: (s: Song) => void;
  onClearSelected: () => void;
  onBatchAdd: () => void;
}

export default function SearchPanel({
  addMode,
  searchInput,
  onSearchChange,
  searching,
  submitting,
  filteredResults,
  selected,
  onResultClick,
  onToggleSelect,
  onClearSelected,
  onBatchAdd,
}: Props) {
  const coverResults = filteredResults.filter((s) => s.type === "翻唱");
  const allCoversSelected =
    coverResults.length > 0 && coverResults.every((s) => selected.has(s.id));

  const toggleSelectAllCovers = () => {
    if (allCoversSelected) {
      for (const s of coverResults) onToggleSelect(s);
    } else {
      for (const s of coverResults) {
        if (!selected.has(s.id)) onToggleSelect(s);
      }
    }
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <p className="text-xs font-medium">
        {addMode === "original" ? (
          <>
            搜索要作为<span className="text-primary">本家</span>关联的歌曲
          </>
        ) : (
          <>
            搜索要作为<span className="text-primary">衍生</span>关联的歌曲
            （支持多选批量添加）
          </>
        )}
      </p>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          className="pl-8 h-9 text-sm"
          placeholder="歌曲名或 ID…"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
        />
        {searching && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* 结果列表 */}
      {filteredResults.length > 0 && (
        <div className="space-y-1">
          {addMode === "derivative" && coverResults.length > 0 && (
            <div className="flex items-center justify-between py-1 px-1">
              <span className="text-[11px] text-muted-foreground">
                搜索结果中有 {coverResults.length} 首翻唱
              </span>
              <button
                onClick={toggleSelectAllCovers}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                {allCoversSelected ? "取消全选翻唱" : "全选翻唱"}
              </button>
            </div>
          )}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredResults.map((s) => {
              const isSelected = selected.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => onResultClick(s)}
                  disabled={submitting}
                  className={`flex w-full items-center gap-2 rounded-md p-2 text-left text-sm transition ${
                    isSelected
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-accent border border-transparent"
                  }`}
                >
                  {addMode === "derivative" && (
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">
                      {s.display_name || s.name}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      #{s.id}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      TYPE_BADGE[s.type] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.type}
                  </span>
                  {addMode === "original" && (
                    <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {searchInput.trim() && !searching && filteredResults.length === 0 && (
        <p className="text-xs text-muted-foreground py-2 text-center">
          未找到结果
        </p>
      )}

      {/* 已选中列表 + 批量提交 */}
      {addMode === "derivative" && selected.size > 0 && (
        <div className="space-y-2 border-t pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              已选中 {selected.size} 首
            </span>
            <button
              onClick={onClearSelected}
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              清空
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {Array.from(selected.values()).map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded-md bg-background px-2.5 py-1.5 text-sm"
              >
                <div className="min-w-0 flex-1 truncate">
                  <span className="font-medium">
                    {s.display_name || s.name}
                  </span>
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    #{s.id}
                  </span>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {s.type}
                </span>
                <button
                  onClick={() => onToggleSelect(s)}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            className="w-full gap-1.5"
            disabled={submitting}
            onClick={onBatchAdd}
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                添加中…
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                批量添加 {selected.size} 首衍生作品
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
