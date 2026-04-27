// src/modules/editor/hooks/useRelations.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import { useDebounce } from "@/shared/hooks/useDebounce";
import type { Song } from "@/core/types/catalog";

export interface RelatedSong {
  id: number;
  name: string;
  display_name?: string | null;
  type?: string;
  thumbnail?: string | null;
  producers?: { id: number; name: string }[];
}

export function useRelations(song: Song) {
  const [originals, setOriginals] = useState<RelatedSong[]>([]);
  const [derivatives, setDerivatives] = useState<RelatedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"original" | "derivative" | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Map<number, Song>>(new Map());
  const dq = useDebounce(query, 400);

  const existingIds = useMemo(
    () =>
      new Set([
        song.id,
        ...originals.map((s) => s.id),
        ...derivatives.map((s) => s.id),
      ]),
    [song.id, originals, derivatives],
  );

  const filtered = useMemo(
    () => results.filter((s) => !existingIds.has(s.id)),
    [results, existingIds],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.getSongRelations(song.id);
      setOriginals(r.originals);
      setDerivatives(r.derivatives);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [song.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!dq || dq.trim().length < 1) {
      setResults([]);
      return;
    }
    const isId = /^\d+$/.test(dq.trim());
    setSearching(true);
    if (isId) {
      api
        .selectSong(Number(dq.trim()))
        .then((r) => setResults([r.data]))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    } else {
      api
        .search("song", dq)
        .then((r: any) => setResults(Array.isArray(r.data) ? r.data : []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }
  }, [dq]);

  const closeMode = useCallback(() => {
    setMode(null);
    setQuery("");
    setResults([]);
    setSelected(new Map());
  }, []);

  const toggle = useCallback((s: Song) => {
    setSelected((prev) => {
      const n = new Map(prev);
      n.has(s.id) ? n.delete(s.id) : n.set(s.id, s);
      return n;
    });
  }, []);

  const addSingle = useCallback(
    async (target: Song, dir: "original" | "derivative") => {
      setBusy(true);
      try {
        if (dir === "original") await api.addSongRelation(song.id, target.id);
        else await api.addSongRelation(target.id, song.id);
        await logEdit({
          targetType: "song",
          targetId: String(song.id),
          action: "add_relation",
          detail: {
            songId: song.id,
            songName: song.name,
            relatedSongName: target.name,
            relatedSongId: target.id,
            direction: dir,
          },
        });
        toast.success("关联已添加");
        closeMode();
        await load();
      } catch (e: any) {
        toast.error(e?.response?.data?.detail || "添加失败");
      } finally {
        setBusy(false);
      }
    },
    [song, closeMode, load],
  );

  const addBatch = useCallback(async () => {
    if (!selected.size) return;
    const ids = Array.from(selected.keys());
    setBusy(true);
    try {
      const r = await api.addSongRelationBatch(song.id, ids);

      if (r.added.length > 0) {
        await logEdit({
          targetType: "song",
          targetId: String(song.id),
          action: "add_relation",
          detail: {
            songId: song.id,
            songName: song.name,
            direction: "derivative",
            batch: true,
            count: r.added.length,
            relations: r.added.map((id: number) => ({
              id,
              name: selected.get(id)?.name || `#${id}`,
            })),
          },
        });
      }

      toast.success(
        `添加 ${r.added_count} 条${r.skipped_count ? `，跳过 ${r.skipped_count} 重复` : ""}`,
      );
      closeMode();
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "批量添加失败");
    } finally {
      setBusy(false);
    }
  }, [selected, song, closeMode, load]);

  const remove = useCallback(
    async (dir: "original" | "derivative", targetId: number) => {
      const list = dir === "original" ? originals : derivatives;
      const t = list.find((s) => s.id === targetId);
      try {
        if (dir === "original") await api.removeSongRelation(song.id, targetId);
        else await api.removeSongRelation(targetId, song.id);
        await logEdit({
          targetType: "song",
          targetId: String(song.id),
          action: "remove_relation",
          detail: {
            songId: song.id,
            songName: song.name,
            relatedSongName: t?.name || `#${targetId}`,
            relatedSongId: targetId,
            direction: dir,
          },
        });
        toast.success("关联已移除");
        await load();
      } catch (e: any) {
        toast.error(e?.response?.data?.detail || "移除失败");
      }
    },
    [song, originals, derivatives, load],
  );

  const findCovers = useCallback(async () => {
    const kw = (song.display_name?.trim() || song.name).trim();
    if (!kw) return;
    closeMode();
    setMode("derivative");
    setQuery(kw);
    setSearching(true);
    try {
      let all: Song[] = [];
      let page = 1;
      while (page <= 5) {
        const r: any = await api.search("song", kw, page, 50);
        const d: Song[] = Array.isArray(r.data) ? r.data : [];
        all = all.concat(d);
        if (d.length < 50) break;
        page++;
      }
      const covers = all.filter(
        (s) =>
          s.type === "翻唱" &&
          !existingIds.has(s.id) &&
          (s.display_name?.trim() || s.name).trim() === kw,
      );
      setResults(all);
      const pre = new Map<number, Song>();
      for (const c of covers) pre.set(c.id, c);
      setSelected(pre);
      toast[covers.length ? "success" : "info"](
        covers.length ? `找到 ${covers.length} 首同名翻唱` : "未找到同名翻唱",
      );
    } catch {
      toast.error("搜索失败");
    } finally {
      setSearching(false);
    }
  }, [song, existingIds, closeMode]);

  return {
    originals,
    derivatives,
    loading,
    mode,
    setMode,
    query,
    setQuery,
    searching,
    busy,
    selected,
    filtered,
    closeMode,
    toggle,
    addSingle,
    addBatch,
    remove,
    findCovers,
    clearSelected: () => setSelected(new Map()),
  };
}
