// src/modules/editor/hooks/useSongForm.ts
import { useState, useRef, useMemo, useEffect } from "react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import type { Song, SongType } from "@/core/types/catalog";

function split(s: string) {
  return s
    .split("、")
    .map((t) => t.trim())
    .filter(Boolean);
}

interface Snap {
  displayName: string;
  type: SongType;
  vocalists: string;
  producers: string;
  synthesizers: string;
}

export function useSongForm(song: Song) {
  const snap = useRef<Snap | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [type, setType] = useState<SongType>("原创");
  const [vocalists, setVocalists] = useState("");
  const [producers, setProducers] = useState("");
  const [synthesizers, setSynthesizers] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s: Snap = {
      displayName: song.display_name ?? "",
      type: song.type,
      vocalists: (song.vocalists ?? []).map((a) => a.name).join("、"),
      producers: (song.producers ?? []).map((a) => a.name).join("、"),
      synthesizers: (song.synthesizers ?? []).map((a) => a.name).join("、"),
    };
    snap.current = s;
    setDisplayName(s.displayName);
    setType(s.type);
    setVocalists(s.vocalists);
    setProducers(s.producers);
    setSynthesizers(s.synthesizers);
  }, [song]);

  const dirty = useMemo(() => {
    const s = snap.current;
    if (!s) return false;
    return (
      displayName !== s.displayName ||
      type !== s.type ||
      vocalists !== s.vocalists ||
      producers !== s.producers ||
      synthesizers !== s.synthesizers
    );
  }, [displayName, type, vocalists, producers, synthesizers]);

  const diff = () => {
    const s = snap.current;
    if (!s) return {};
    const c: Record<string, { old: string; new: string }> = {};
    if (displayName !== s.displayName)
      c["显示名称"] = {
        old: s.displayName || "（空）",
        new: displayName || "（空）",
      };
    if (type !== s.type) c["类型"] = { old: s.type, new: type };
    if (vocalists !== s.vocalists)
      c["歌手"] = { old: s.vocalists || "（空）", new: vocalists || "（空）" };
    if (producers !== s.producers)
      c["作者"] = { old: s.producers || "（空）", new: producers || "（空）" };
    if (synthesizers !== s.synthesizers)
      c["引擎"] = {
        old: s.synthesizers || "（空）",
        new: synthesizers || "（空）",
      };
    return c;
  };

  const save = async () => {
    setSaving(true);
    try {
      const [v, p, s] = await Promise.all([
        split(vocalists).length
          ? api.resolveArtists("vocalist", split(vocalists))
          : { data: [] },
        split(producers).length
          ? api.resolveArtists("producer", split(producers))
          : { data: [] },
        split(synthesizers).length
          ? api.resolveArtists("synthesizer", split(synthesizers))
          : { data: [] },
      ]);
      await api.editSong({
        id: song.id,
        display_name: displayName || undefined,
        type,
        vocalist_ids: v.data.map((a) => a.id),
        producer_ids: p.data.map((a) => a.id),
        synthesizer_ids: s.data.map((a) => a.id),
      });

      const rawDiff: Record<string, { old: string; new: string }> = {};
      const sc = snap.current;
      if (sc) {
        if (displayName !== sc.displayName)
          rawDiff.display_name = { old: sc.displayName, new: displayName };
        if (type !== sc.type) rawDiff.type = { old: sc.type, new: type };
        if (vocalists !== sc.vocalists)
          rawDiff.vocal = { old: sc.vocalists, new: vocalists };
        if (producers !== sc.producers)
          rawDiff.author = { old: sc.producers, new: producers };
        if (synthesizers !== sc.synthesizers)
          rawDiff.synthesizer = { old: sc.synthesizers, new: synthesizers };
      }

      logEdit({
        targetType: "song",
        targetId: String(song.id),
        action: "edit_song",
        detail: {
          songName: song.name,
          bvids: (song.videos ?? []).map((v) => v.bvid),
          changes: rawDiff,
        },
      });
      snap.current = { displayName, type, vocalists, producers, synthesizers };
      toast.success("歌曲信息已更新");
      return true;
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "更新失败");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    displayName,
    setDisplayName,
    type,
    setType,
    vocalists,
    setVocalists,
    producers,
    setProducers,
    synthesizers,
    setSynthesizers,
    dirty,
    saving,
    save,
    diff,
  };
}
