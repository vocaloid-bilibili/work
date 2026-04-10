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
  disabled: boolean;
}

export function useVideoForm(video: Video) {
  const snap = useRef<Snap | null>(null);
  const [title, setTitle] = useState("");
  const [copyright, setCopyright] = useState(1);
  const [disabled, setDisabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s: Snap = {
      title: video.title,
      copyright: video.copyright ?? 3,
      disabled: video.disabled ?? false,
    };
    snap.current = s;
    setTitle(s.title);
    setCopyright(s.copyright);
    setDisabled(s.disabled);
  }, [video]);

  const dirty = useMemo(() => {
    const s = snap.current;
    if (!s) return false;
    return (
      title !== s.title || copyright !== s.copyright || disabled !== s.disabled
    );
  }, [title, copyright, disabled]);

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
    if (disabled !== s.disabled)
      c["禁用"] = {
        old: s.disabled ? "是" : "否",
        new: disabled ? "是" : "否",
      };
    return c;
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.editVideo({ bvid: video.bvid, title, copyright, disabled });

      const rawDiff: Record<string, { old: unknown; new: unknown }> = {};
      const s = snap.current;
      if (s) {
        if (title !== s.title) rawDiff.title = { old: s.title, new: title };
        if (copyright !== s.copyright)
          rawDiff.copyright = { old: s.copyright, new: copyright };
        if (disabled !== s.disabled)
          rawDiff.disabled = { old: s.disabled, new: disabled };
      }

      logEdit({
        targetType: "video",
        targetId: video.bvid,
        action: "edit_video",
        detail: { bvid: video.bvid, title: video.title, changes: rawDiff },
      });
      snap.current = { title, copyright, disabled };
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
    disabled,
    setDisabled,
    dirty,
    saving,
    save,
    diff,
  };
}
