// src/modules/editor/song/relations/SongRelationsEditor.tsx
import { Button } from "@/ui/button";
import { Loader2, Mic, Plus, X } from "lucide-react";
import type { Song } from "@/core/types/catalog";
import { useRelationEditor } from "./useRelationEditor";
import RelationRow from "./RelationRow";
import SearchPanel from "./SearchPanel";

interface Props {
  song: Song;
}

export default function SongRelationsEditor({ song }: Props) {
  const r = useRelationEditor(song);

  if (r.loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        加载关联…
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">关联作品</h3>
      </div>

      {/* 本家列表 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            本家作品（此歌曲衍生自）
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => {
              if (r.addMode === "original") {
                r.closeAddMode();
              } else {
                r.closeAddMode();
                r.setAddMode("original");
              }
            }}
          >
            {r.addMode === "original" ? (
              <X className="h-3 w-3" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            {r.addMode === "original" ? "取消" : "添加"}
          </Button>
        </div>
        {r.originals.length === 0 && r.addMode !== "original" && (
          <p className="text-xs text-muted-foreground py-2">无</p>
        )}
        <div className="space-y-1.5">
          {r.originals.map((s) => (
            <RelationRow
              key={s.id}
              song={s}
              onRemove={() => r.handleRemove("original", s.id)}
            />
          ))}
        </div>
      </div>

      {/* 衍生列表 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            衍生作品（衍生自此歌曲）
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-blue-600 dark:text-blue-400"
              onClick={r.handleFindCovers}
              disabled={r.findingCovers}
            >
              {r.findingCovers ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Mic className="h-3 w-3" />
              )}
              查找同名翻唱
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => {
                if (r.addMode === "derivative") {
                  r.closeAddMode();
                } else {
                  r.closeAddMode();
                  r.setAddMode("derivative");
                }
              }}
            >
              {r.addMode === "derivative" ? (
                <X className="h-3 w-3" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              {r.addMode === "derivative" ? "取消" : "手动添加"}
            </Button>
          </div>
        </div>
        {r.derivatives.length === 0 && r.addMode !== "derivative" && (
          <p className="text-xs text-muted-foreground py-2">无</p>
        )}
        <div className="space-y-1.5">
          {r.derivatives.map((s) => (
            <RelationRow
              key={s.id}
              song={s}
              onRemove={() => r.handleRemove("derivative", s.id)}
            />
          ))}
        </div>
      </div>

      {/* 搜索面板 */}
      {r.addMode && (
        <SearchPanel
          addMode={r.addMode}
          searchInput={r.searchInput}
          onSearchChange={r.setSearchInput}
          searching={r.searching}
          submitting={r.submitting}
          filteredResults={r.filteredResults}
          selected={r.selected}
          onResultClick={r.handleResultClick}
          onToggleSelect={r.toggleSelect}
          onClearSelected={r.clearSelected}
          onBatchAdd={r.handleBatchAdd}
        />
      )}
    </div>
  );
}
