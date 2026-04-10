// src/modules/editor/song/relations/SearchPanel.tsx
import { Check, Loader2, Music, Plus, Search, X } from "lucide-react";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import CachedImg from "@/shared/ui/CachedImg";
import type { Song } from "@/core/types/catalog";

const TYPE_BADGE: Record<string, string> = {
  翻唱: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  原创: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  本家重置: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  串烧: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

function getThumbnail(s: Song): string | null {
  const videos = (s as any).videos;
  if (Array.isArray(videos) && videos.length > 0) {
    return videos[0].thumbnail ?? null;
  }
  return null;
}

function SongResultCard({
  song,
  isSelected,
  showCheckbox,
  showPlus,
  disabled,
  onClick,
}: {
  song: Song;
  isSelected: boolean;
  showCheckbox: boolean;
  showPlus: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const displayName = song.display_name?.trim() || song.name;
  const realName = song.display_name?.trim() ? song.name : null;
  const thumb = getThumbnail(song);
  const producers = song.producers ?? [];
  const vocalists = song.vocalists ?? [];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-start gap-2.5 rounded-md p-2 text-left text-sm transition ${
        isSelected
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-accent border border-transparent"
      }`}
    >
      {showCheckbox && (
        <div
          className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
            isSelected
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/30"
          }`}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </div>
      )}

      {thumb ? (
        <CachedImg
          src={thumb}
          alt=""
          className="mt-0.5 h-10 w-15 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="mt-0.5 flex h-10 w-15 shrink-0 items-center justify-center rounded bg-muted">
          <Music className="h-3.5 w-3.5 text-muted-foreground/40" />
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium">{displayName}</span>
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
              TYPE_BADGE[song.type] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {song.type}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>#{song.id}</span>
          {realName && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span className="truncate">原名: {realName}</span>
            </>
          )}
        </div>

        {(producers.length > 0 || vocalists.length > 0) && (
          <div className="flex items-center gap-1.5 text-[11px]">
            {producers.length > 0 && (
              <span className="truncate rounded bg-blue-500/10 px-1.5 py-px text-blue-600 dark:text-blue-400">
                {producers.map((p) => p.name).join(", ")}
              </span>
            )}
            {vocalists.length > 0 && (
              <span className="truncate rounded bg-pink-500/10 px-1.5 py-px text-pink-600 dark:text-pink-400">
                {vocalists.map((v) => v.name).join(", ")}
              </span>
            )}
          </div>
        )}
      </div>

      {showPlus && <Plus className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />}
    </button>
  );
}

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
          <div className="max-h-72 overflow-y-auto space-y-1">
            {filteredResults.map((s) => (
              <SongResultCard
                key={s.id}
                song={s}
                isSelected={selected.has(s.id)}
                showCheckbox={addMode === "derivative"}
                showPlus={addMode === "original"}
                disabled={submitting}
                onClick={() => onResultClick(s)}
              />
            ))}
          </div>
        </div>
      )}

      {searchInput.trim() && !searching && filteredResults.length === 0 && (
        <p className="text-xs text-muted-foreground py-2 text-center">
          未找到结果
        </p>
      )}

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
            {Array.from(selected.values()).map((s) => {
              const displayName = s.display_name?.trim() || s.name;
              const thumb = getThumbnail(s);
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-2 rounded-md bg-background px-2.5 py-1.5 text-sm"
                >
                  {thumb ? (
                    <CachedImg
                      src={thumb}
                      alt=""
                      className="h-7 w-10 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-10 shrink-0 items-center justify-center rounded bg-muted">
                      <Music className="h-3 w-3 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{displayName}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      #{s.id} · {s.type}
                    </span>
                  </div>
                  <button
                    onClick={() => onToggleSelect(s)}
                    className="shrink-0 text-muted-foreground hover:text-destructive transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
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
