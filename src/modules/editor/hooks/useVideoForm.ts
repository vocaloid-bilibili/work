// src/modules/editor/hooks/useVideoForm.ts
import { useState, useRef, useMemo, useEffect } from "react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import { COPYRIGHT_MAP } from "@/core/types/constants";
import type { Video } from "@/core/types/catalog";

interface Snap {
  title: string;
  copyright: number;
}

export function useVideoForm(
  video: Video,
  songInfo?: { id: number; name: string } | null,
) {
  const snap = useRef<Snap | null>(null);
  const [title, setTitle] = useState("");
  const [copyright, setCopyright] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s: Snap = {
      title: video.title,
      copyright: video.copyright ?? 3,
    };
    snap.current = s;
    setTitle(s.title);
    setCopyright(s.copyright);
  }, [video]);

  const dirty = useMemo(() => {
    const s = snap.current;
    if (!s) return false;
    return title !== s.title || copyright !== s.copyright;
  }, [title, copyright]);

  const diff = () => {
    const s = snap.current;
    if (!s) return {};
    const c: Record<string, { old: string; new: string }> = {};
    if (title !== s.title) c["标题"] = { old: s.title, new: title };
    if (copyright !== s.copyright)
      c["视频类型"] = {
        old: COPYRIGHT_MAP[s.copyright] ?? String(s.copyright),
        new: COPYRIGHT_MAP[copyright] ?? String(copyright),
      };
    return c;
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.editVideo({ bvid: video.bvid, title, copyright });

      const rawDiff: Record<string, { old: unknown; new: unknown }> = {};
      const s = snap.current;
      if (s) {
        if (title !== s.title) rawDiff.title = { old: s.title, new: title };
        if (copyright !== s.copyright)
          rawDiff.copyright = { old: s.copyright, new: copyright };
      }

      await logEdit({
        targetType: "video",
        targetId: video.bvid,
        action: "edit_video",
        detail: {
          bvid: video.bvid,
          title: video.title,
          songId: songInfo?.id ?? null,
          songName: songInfo?.name ?? null,
          changes: rawDiff,
        },
      });
      snap.current = { title, copyright };
      toast.success("视频信息已更新");
      return true;
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "更新失败");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    title,
    setTitle,
    copyright,
    setCopyright,
    dirty,
    saving,
    save,
    diff,
  };
}
