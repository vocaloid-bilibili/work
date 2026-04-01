// src/modules/editor/video/useVideoForm.ts
import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import type { Video } from "@/core/types/catalog";

interface Orig {
  title: string;
  copyright: number;
  disabled: boolean;
}

export function useVideoForm(video: Video) {
  const origRef = useRef<Orig | null>(null);
  const idRef = useRef("");

  const [title, setTitle] = useState("");
  const [copyright, setCopyright] = useState(1);
  const [disabled, setDisabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (video.bvid !== idRef.current) {
    idRef.current = video.bvid;
    const o: Orig = {
      title: video.title,
      copyright: video.copyright ?? 3,
      disabled: video.disabled ?? false,
    };
    origRef.current = o;
    setTitle(o.title);
    setCopyright(o.copyright);
    setDisabled(o.disabled);
  }

  const orig = origRef.current;
  const hasChanges = useMemo(() => {
    if (!orig) return false;
    return (
      title !== orig.title ||
      copyright !== orig.copyright ||
      disabled !== orig.disabled
    );
  }, [title, copyright, disabled, orig]);

  const changes = () => {
    if (!orig) return {};
    const c: Record<string, { old: unknown; new: unknown }> = {};
    if (title !== orig.title) c.title = { old: orig.title, new: title };
    if (copyright !== orig.copyright)
      c.copyright = { old: orig.copyright, new: copyright };
    if (disabled !== orig.disabled)
      c.disabled = { old: orig.disabled, new: disabled };
    return c;
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      await api.editVideo({ bvid: video.bvid, title, copyright, disabled });
      logEdit({
        targetType: "video",
        targetId: video.bvid,
        action: "edit_video",
        detail: { bvid: video.bvid, title: video.title, changes: changes() },
      });
      origRef.current = { title, copyright, disabled };
      toast.success("视频信息更新成功");
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "更新失败");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    title,
    setTitle,
    copyright,
    setCopyright,
    disabled,
    setDisabled,
    hasChanges,
    submitting,
    submit,
    changes,
    orig,
  };
}
