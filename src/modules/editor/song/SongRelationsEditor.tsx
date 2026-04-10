// src/modules/editor/song/SongRelationsEditor.tsx

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import { useDebounce } from "@/shared/hooks/useDebounce";
import type { Song } from "@/core/types/catalog";

interface RelatedSong {
  id: number;
  name: string;
  display_name?: string | null;
  type?: string;
  thumbnail?: string | null;
  producers?: { id: number; name: string }[];
  vocalists?: { id: number; name: string }[];
}

interface Props {
  song: Song;
}

export default function SongRelationsEditor({ song }: Props) {
  const [originals, setOriginals] = useState<RelatedSong[]>([]);
  const [derivatives, setDerivatives] = useState<RelatedSong[]>([]);
  const [loading, setLoading] = useState(true);

  const [addMode, setAddMode] = useState<"original" | "derivative" | null>(
    null,
  );
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searching, setSearching] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getSongRelations(song.id);
      setOriginals(res.originals);
      setDerivatives(res.derivatives);
    } catch {
      // 可能无权限，静默
    } finally {
      setLoading(false);
    }
  }, [song.id]);

  useEffect(() => {
    load();
  }, [load]);

  // 搜索
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    const isId = /^\d+$/.test(debouncedSearch.trim());
    if (isId) {
      setSearching(true);
      api
        .selectSong(Number(debouncedSearch.trim()))
        .then((r) => setSearchResults([r.data]))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
      return;
    }
    setSearching(true);
    api
      .search("song", debouncedSearch)
      .then((r: any) => setSearchResults(Array.isArray(r.data) ? r.data : []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }, [debouncedSearch]);

  const handleAdd = async (targetId: number) => {
    if (!addMode) return;
    try {
      if (addMode === "original") {
        // 当前歌曲是衍生，targetId 是本家
        await api.addSongRelation(song.id, targetId);
      } else {
        // 当前歌曲是本家，targetId 是衍生
        await api.addSongRelation(targetId, song.id);
      }
      logEdit({
        targetType: "song",
        targetId: String(song.id),
        action: `add_relation_${addMode}`,
        detail: { related_song_id: targetId },
      });
      toast.success("关联已添加");
      setAddMode(null);
      setSearchInput("");
      setSearchResults([]);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "添加失败");
    }
  };

  const handleRemove = async (
    direction: "original" | "derivative",
    targetId: number,
  ) => {
    try {
      if (direction === "original") {
        await api.removeSongRelation(song.id, targetId);
      } else {
        await api.removeSongRelation(targetId, song.id);
      }
      logEdit({
        targetType: "song",
        targetId: String(song.id),
        action: `remove_relation_${direction}`,
        detail: { related_song_id: targetId },
      });
      toast.success("关联已移除");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "移除失败");
    }
  };

  // 过滤掉自身和已关联的
  const existingIds = new Set([
    song.id,
    ...originals.map((s) => s.id),
    ...derivatives.map((s) => s.id),
  ]);
  const filteredResults = searchResults.filter((s) => !existingIds.has(s.id));

  if (loading) {
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
              setAddMode(addMode === "original" ? null : "original");
              setSearchInput("");
              setSearchResults([]);
            }}
          >
            {addMode === "original" ? (
              <X className="h-3 w-3" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            {addMode === "original" ? "取消" : "添加"}
          </Button>
        </div>
        {originals.length === 0 && addMode !== "original" && (
          <p className="text-xs text-muted-foreground py-2">无</p>
        )}
        <div className="space-y-1.5">
          {originals.map((s) => (
            <RelationRow
              key={s.id}
              song={s}
              onRemove={() => handleRemove("original", s.id)}
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
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => {
              setAddMode(addMode === "derivative" ? null : "derivative");
              setSearchInput("");
              setSearchResults([]);
            }}
          >
            {addMode === "derivative" ? (
              <X className="h-3 w-3" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            {addMode === "derivative" ? "取消" : "添加"}
          </Button>
        </div>
        {derivatives.length === 0 && addMode !== "derivative" && (
          <p className="text-xs text-muted-foreground py-2">无</p>
        )}
        <div className="space-y-1.5">
          {derivatives.map((s) => (
            <RelationRow
              key={s.id}
              song={s}
              onRemove={() => handleRemove("derivative", s.id)}
            />
          ))}
        </div>
      </div>

      {/* 搜索面板 */}
      {addMode && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <p className="text-xs font-medium">
            搜索要作为
            <span className="text-primary">
              {addMode === "original" ? "本家" : "衍生"}
            </span>
            关联的歌曲
          </p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-9 text-sm"
              placeholder="歌曲名或 ID…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoFocus
            />
            {searching && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
          {filteredResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredResults.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleAdd(s.id)}
                  className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accent transition"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">
                      {s.display_name || s.name}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      #{s.id} · {s.type}
                    </span>
                  </div>
                  <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
                </button>
              ))}
            </div>
          )}
          {searchInput.trim() && !searching && filteredResults.length === 0 && (
            <p className="text-xs text-muted-foreground py-2 text-center">
              未找到结果
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function RelationRow({
  song,
  onRemove,
}: {
  song: RelatedSong;
  onRemove: () => void;
}) {
  const name = song.display_name?.trim() || song.name;
  return (
    <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
      {song.thumbnail && (
        <img
          src={song.thumbnail}
          alt=""
          className="h-8 w-11 shrink-0 rounded object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">
          #{song.id} · {song.type}
          {song.producers?.length
            ? ` · ${song.producers.map((p) => p.name).join(", ")}`
            : ""}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
