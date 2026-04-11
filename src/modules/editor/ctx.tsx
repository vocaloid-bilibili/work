// src/modules/editor/ctx.tsx
import { createContext, useContext, useCallback, useState } from "react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { useNav, type NavAPI } from "./hooks/useNav";

interface EditorCtxValue extends NavAPI {
  loading: boolean;
  openSong: (id: number) => Promise<void>;
  openVideo: (bvid: string) => Promise<void>;
}

const Ctx = createContext<EditorCtxValue | null>(null);

export function useEditor(): EditorCtxValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEditor must be used within EditorProvider");
  return ctx;
}

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const nav = useNav();
  const [loading, setLoading] = useState(false);

  const openSong = useCallback(
    async (id: number) => {
      setLoading(true);
      try {
        const r = await api.selectSong(id, true);
        nav.push({ id: "song", song: r.data });
      } catch (e: any) {
        toast.error(e?.response?.data?.detail || "加载歌曲失败");
      } finally {
        setLoading(false);
      }
    },
    [nav],
  );

  const openVideo = useCallback(
    async (bvid: string) => {
      setLoading(true);
      try {
        const r = await api.selectVideo(bvid);
        nav.push({ id: "video", video: r.data });
      } catch (e: any) {
        toast.error(e?.response?.data?.detail || "加载视频失败");
      } finally {
        setLoading(false);
      }
    },
    [nav],
  );

  const value: EditorCtxValue = {
    ...nav,
    loading,
    openSong,
    openVideo,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
