// src/modules/editor/song/relations/useRelationEditor.ts
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import { useDebounce } from "@/shared/hooks/useDebounce";
import type { Song } from "@/core/types/catalog";
import type { RelatedSong } from "./types";

export function useRelationEditor(song: Song) {
  const [originals, setOriginals] = useState<RelatedSong[]>([]);
  const [derivatives, setDerivatives] = useState<RelatedSong[]>([]);
  const [loading, setLoading] = useState(true);

  const [addMode, setAddMode] = useState<"original" | "derivative" | null>(
    null,
  );
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 400);
  const [selected, setSelected] = useState<Map<number, Song>>(new Map());
  const [findingCovers, setFindingCovers] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getSongRelations(song.id);
      setOriginals(res.originals);
      setDerivatives(res.derivatives);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [song.id]);

  useEffect(() => {
    load();
  }, [load]);

  // 搜索
  useEffect(() => {
    if (findingCovers) return;
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
  }, [debouncedSearch, findingCovers]);

  const closeAddMode = useCallback(() => {
    setAddMode(null);
    setSearchInput("");
    setSearchResults([]);
    setSelected(new Map());
    setFindingCovers(false);
  }, []);

  const toggleSelect = useCallback((s: Song) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(s.id)) next.delete(s.id);
      else next.set(s.id, s);
      return next;
    });
  }, []);

  const handleFindCovers = useCallback(async () => {
    const keyword = (song.display_name?.trim() || song.name).trim();
    if (!keyword) {
      toast.error("歌曲名称为空，无法查找");
      return;
    }

    closeAddMode();
    setAddMode("derivative");
    setSearchInput(keyword);
    setFindingCovers(true);
    setSearching(true);

    const existingIds = new Set([
      song.id,
      ...originals.map((s) => s.id),
      ...derivatives.map((s) => s.id),
    ]);

    try {
      let allResults: Song[] = [];
      let page = 1;
      const pageSize = 50;

      while (page <= 5) {
        const res: any = await api.search("song", keyword, page, pageSize);
        const data: Song[] = Array.isArray(res.data) ? res.data : [];
        allResults = allResults.concat(data);
        if (data.length < pageSize) break;
        page++;
      }

      const covers = allResults.filter(
        (s) =>
          s.type === "翻唱" &&
          !existingIds.has(s.id) &&
          (s.display_name?.trim() || s.name).trim() === keyword,
      );

      setSearchResults(allResults);

      const preSelected = new Map<number, Song>();
      for (const c of covers) preSelected.set(c.id, c);
      setSelected(preSelected);

      if (covers.length === 0) {
        toast.info(`未找到名为「${keyword}」的翻唱作品`);
      } else {
        toast.success(
          `找到 ${covers.length} 首同名翻唱，已全部选中，可取消勾选不需要的`,
        );
      }
    } catch {
      toast.error("搜索失败");
    } finally {
      setSearching(false);
      setFindingCovers(false);
    }
  }, [song, originals, derivatives, closeAddMode]);

  const handleAddSingle = useCallback(
    async (targetId: number) => {
      if (!addMode) return;
      setSubmitting(true);
      try {
        if (addMode === "original") {
          await api.addSongRelation(song.id, targetId);
        } else {
          await api.addSongRelation(targetId, song.id);
        }
        logEdit({
          targetType: "song",
          targetId: String(song.id),
          action: `add_relation_${addMode}`,
          detail: {
            songName: song.display_name || song.name,
            related_song_id: targetId,
          },
        });
        toast.success("关联已添加");
        closeAddMode();
        await load();
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || err?.message || "添加失败");
      } finally {
        setSubmitting(false);
      }
    },
    [addMode, song, closeAddMode, load],
  );

  const handleBatchAdd = useCallback(async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected.keys());

    setSubmitting(true);
    try {
      const res = await api.addSongRelationBatch(song.id, ids);
      logEdit({
        targetType: "song",
        targetId: String(song.id),
        action: "batch_add_relation_derivative",
        detail: {
          songName: song.display_name || song.name,
          added: res.added,
          skipped: res.skipped,
        },
      });

      const parts: string[] = [];
      if (res.added_count > 0) parts.push(`成功添加 ${res.added_count} 条`);
      if (res.skipped_count > 0) parts.push(`跳过 ${res.skipped_count} 条重复`);
      toast.success(parts.join("，") || "操作完成");

      closeAddMode();
      await load();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || err?.message || "批量添加失败",
      );
    } finally {
      setSubmitting(false);
    }
  }, [selected, song, closeAddMode, load]);

  const handleResultClick = useCallback(
    (s: Song) => {
      if (addMode === "original") {
        handleAddSingle(s.id);
      } else {
        toggleSelect(s);
      }
    },
    [addMode, handleAddSingle, toggleSelect],
  );

  const handleRemove = useCallback(
    async (direction: "original" | "derivative", targetId: number) => {
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
          detail: {
            songName: song.display_name || song.name,
            related_song_id: targetId,
          },
        });
        toast.success("关联已移除");
        await load();
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || err?.message || "移除失败");
      }
    },
    [song, load],
  );

  // 过滤掉自身和已关联的
  const existingIds = new Set([
    song.id,
    ...originals.map((s) => s.id),
    ...derivatives.map((s) => s.id),
  ]);
  const filteredResults = searchResults.filter((s) => !existingIds.has(s.id));

  return {
    originals,
    derivatives,
    loading,
    addMode,
    setAddMode,
    searchInput,
    setSearchInput: (v: string) => {
      setSearchInput(v);
      setFindingCovers(false);
    },
    searching,
    submitting,
    selected,
    filteredResults,
    findingCovers,
    closeAddMode,
    toggleSelect,
    handleFindCovers,
    handleResultClick,
    handleBatchAdd,
    handleRemove,
    clearSelected: () => setSelected(new Map()),
  };
}
