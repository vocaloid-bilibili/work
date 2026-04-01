// src/modules/editor/hooks/useVideoLoader.ts
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import type { Video, Song } from "@/core/types/catalog";

export function useVideoLoader() {
  const [video, setVideo] = useState<Video | null>(null);
  const [parentSong, setParentSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (bvid: string) => {
    const bv = bvid.trim();
    if (!bv) {
      toast.warning("请输入BV号");
      return null;
    }
    try {
      setLoading(true);
      const r = await api.selectVideo(bv);
      setVideo(r.data);
      return r.data;
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || err?.message || "获取视频失败",
      );
      setVideo(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载所属歌曲
  useEffect(() => {
    if (!video?.song_id) {
      setParentSong(null);
      return;
    }
    let c = false;
    api
      .selectSong(video.song_id)
      .then((r) => {
        if (!c) setParentSong(r.data);
      })
      .catch(() => {
        if (!c) setParentSong(null);
      });
    return () => {
      c = true;
    };
  }, [video?.song_id]);

  const clear = useCallback(() => {
    setVideo(null);
    setParentSong(null);
  }, []);

  return { video, parentSong, loading, load, clear };
}
