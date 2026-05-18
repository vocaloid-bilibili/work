// src/modules/editor/hooks/useSongForm.ts
import { useState, useMemo, useCallback } from "react";
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

function setToSorted(s: Set<string>): string[] {
  return [...s].sort();
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

interface Snap {
  displayName: string;
  type: SongType;
  collected: boolean;
  vocalists: string;
  producers: string;
  synthesizers: string;
  vocalSupport: Set<string>;
}

function deriveSnap(song: Song): Snap {
  return {
    displayName: song.display_name ?? "",
    type: song.type,
    collected: song.collected ?? true,
    vocalists: (song.vocalists ?? []).map((a) => a.name).join("、"),
    producers: (song.producers ?? []).map((a) => a.name).join("、"),
    synthesizers: (song.synthesizers ?? []).map((a) => a.name).join("、"),
    vocalSupport: new Set(
      (song.vocalists ?? []).filter((a) => a.is_support).map((a) => a.name),
    ),
  };
}

export function useSongForm(song: Song) {
  const [snap, setSnap] = useState(() => deriveSnap(song));
  const [displayName, setDisplayName] = useState(() => snap.displayName);
  const [type, setType] = useState<SongType>(() => snap.type);
  const [collected, setCollected] = useState(() => snap.collected);
  const [vocalists, setVocalists] = useState(() => snap.vocalists);
  const [producers, setProducers] = useState(() => snap.producers);
  const [synthesizers, setSynthesizers] = useState(() => snap.synthesizers);
  const [vocalSupport, setVocalSupport] = useState(() => snap.vocalSupport);
  const [saving, setSaving] = useState(false);

  // song 变化时重置（render-time state adjustment）
  const [prevSongId, setPrevSongId] = useState(song.id);
  if (prevSongId !== song.id) {
    setPrevSongId(song.id);
    const s = deriveSnap(song);
    setSnap(s);
    setDisplayName(s.displayName);
    setType(s.type);
    setCollected(s.collected);
    setVocalists(s.vocalists);
    setProducers(s.producers);
    setSynthesizers(s.synthesizers);
    setVocalSupport(s.vocalSupport);
  }

  const toggleVocalSupport = useCallback(
    (name: string) => {
      setVocalSupport((prev) => {
        const next = new Set(prev);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        const currentNames = split(vocalists);
        return new Set([...next].filter((n) => currentNames.includes(n)));
      });
    },
    [vocalists],
  );

  const dirty = useMemo(
    () =>
      displayName !== snap.displayName ||
      type !== snap.type ||
      collected !== snap.collected ||
      vocalists !== snap.vocalists ||
      producers !== snap.producers ||
      synthesizers !== snap.synthesizers ||
      !setsEqual(vocalSupport, snap.vocalSupport),
    [
      snap,
      displayName,
      type,
      collected,
      vocalists,
      producers,
      synthesizers,
      vocalSupport,
    ],
  );

  const diff = () => {
    const c: Record<string, { old: string; new: string }> = {};
    if (displayName !== snap.displayName)
      c["显示名称"] = {
        old: snap.displayName || "（空）",
        new: displayName || "（空）",
      };
    if (type !== snap.type) c["类型"] = { old: snap.type, new: type };
    if (collected !== snap.collected)
      c["收录状态"] = {
        old: snap.collected ? "收录" : "参考",
        new: collected ? "收录" : "参考",
      };
    if (vocalists !== snap.vocalists)
      c["歌手"] = {
        old: snap.vocalists || "（空）",
        new: vocalists || "（空）",
      };
    if (!setsEqual(vocalSupport, snap.vocalSupport)) {
      const oldSupport = setToSorted(snap.vocalSupport).join("、") || "（无）";
      const newSupport = setToSorted(vocalSupport).join("、") || "（无）";
      c["和声"] = { old: oldSupport, new: newSupport };
    }
    if (producers !== snap.producers)
      c["作者"] = {
        old: snap.producers || "（空）",
        new: producers || "（空）",
      };
    if (synthesizers !== snap.synthesizers)
      c["引擎"] = {
        old: snap.synthesizers || "（空）",
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

      const vocalistPayload = v.data.map((a) => ({
        id: a.id,
        is_support: vocalSupport.has(a.name),
      }));

      const res = await api.editSong({
        id: song.id,
        display_name: displayName,
        type,
        collected,
        vocalists: vocalistPayload,
        producer_ids: p.data.map((a) => a.id),
        synthesizer_ids: s.data.map((a) => a.id),
      });

      const rawDiff: Record<
        string,
        { old: string | boolean; new: string | boolean }
      > = {};
      if (displayName !== snap.displayName)
        rawDiff.display_name = { old: snap.displayName, new: displayName };
      if (type !== snap.type) rawDiff.type = { old: snap.type, new: type };
      if (collected !== snap.collected)
        rawDiff.collected = { old: snap.collected, new: collected };
      if (vocalists !== snap.vocalists)
        rawDiff.vocal = { old: snap.vocalists, new: vocalists };
      if (!setsEqual(vocalSupport, snap.vocalSupport))
        rawDiff.vocal_support = {
          old: setToSorted(snap.vocalSupport).join("、"),
          new: setToSorted(vocalSupport).join("、"),
        };
      if (producers !== snap.producers)
        rawDiff.author = { old: snap.producers, new: producers };
      if (synthesizers !== snap.synthesizers)
        rawDiff.synthesizer = { old: snap.synthesizers, new: synthesizers };

      const detail: Record<string, unknown> = {
        songId: song.id,
        songName: song.name,
        bvids: (song.videos ?? [])
          .filter((vid) => !vid.disabled)
          .map((vid) => vid.bvid),
        changes: rawDiff,
      };
      if (res.collected_rows) detail.collectedRows = res.collected_rows;

      await logEdit({
        targetType: "song",
        targetId: String(song.id),
        action: "edit_song",
        detail,
      });
      setSnap({
        displayName,
        type,
        collected,
        vocalists,
        producers,
        synthesizers,
        vocalSupport: new Set(vocalSupport),
      });
      toast.success("歌曲信息已更新");
      return true;
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      toast.error(err?.response?.data?.detail || "更新失败");
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
    collected,
    setCollected,
    vocalists,
    setVocalists,
    producers,
    setProducers,
    synthesizers,
    setSynthesizers,
    vocalSupport,
    toggleVocalSupport,
    dirty,
    saving,
    save,
    diff,
  };
}
