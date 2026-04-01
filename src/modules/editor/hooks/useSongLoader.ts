// src/modules/editor/hooks/useSongLoader.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import type { Song } from "@/core/types/catalog";

export function useSongLoader() {
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (item: { id: number; name: string } | null) => {
      if (!item) {
        setSong(null);
        return null;
      }
      try {
        setLoading(true);
        const r = await api.selectSong(item.id);
        setSong(r.data);
        return r.data;
      } catch (err: any) {
        toast.error(
          err?.response?.data?.detail || err?.message || "获取歌曲失败",
        );
        setSong(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clear = useCallback(() => setSong(null), []);

  return { song, loading, load, clear };
}
