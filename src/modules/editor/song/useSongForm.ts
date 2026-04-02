// src/modules/editor/song/useSongForm.ts
import { useState, useRef, useMemo, useEffect } from "react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import type { Song, SongType } from "@/core/types/catalog";

function tags(s: string) {
  return s
    .split("、")
    .map((t) => t.trim())
    .filter(Boolean);
}

interface Orig {
  displayName: string;
  type: SongType;
  vocalists: string;
  producers: string;
  synthesizers: string;
}

export function useSongForm(song: Song) {
  const origRef = useRef<Orig | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [type, setType] = useState<SongType>("原创");
  const [vocalists, setVocalists] = useState("");
  const [producers, setProducers] = useState("");
  const [synthesizers, setSynthesizers] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const o: Orig = {
      displayName: song.display_name ?? "",
      type: song.type as SongType,
      vocalists: (song.vocalists ?? []).map((a) => a.name).join("、"),
      producers: (song.producers ?? []).map((a) => a.name).join("、"),
      synthesizers: (song.synthesizers ?? []).map((a) => a.name).join("、"),
    };
    origRef.current = o;
    setDisplayName(o.displayName);
    setType(o.type);
    setVocalists(o.vocalists);
    setProducers(o.producers);
    setSynthesizers(o.synthesizers);
  }, [song]);

  const orig = origRef.current;
  const hasChanges = useMemo(() => {
    if (!orig) return false;
    return (
      displayName !== orig.displayName ||
      type !== orig.type ||
      vocalists !== orig.vocalists ||
      producers !== orig.producers ||
      synthesizers !== orig.synthesizers
    );
  }, [displayName, type, vocalists, producers, synthesizers, orig]);

  const changes = () => {
    if (!orig) return {};
    const c: Record<string, { old: string; new: string }> = {};
    if (displayName !== orig.displayName)
      c.display_name = { old: orig.displayName, new: displayName };
    if (type !== orig.type) c.type = { old: orig.type, new: type };
    if (vocalists !== orig.vocalists)
      c.vocal = { old: orig.vocalists, new: vocalists };
    if (producers !== orig.producers)
      c.author = { old: orig.producers, new: producers };
    if (synthesizers !== orig.synthesizers)
      c.synthesizer = { old: orig.synthesizers, new: synthesizers };
    return c;
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      const [v, p, s] = await Promise.all([
        tags(vocalists).length
          ? api.resolveArtists("vocalist", tags(vocalists))
          : { data: [] },
        tags(producers).length
          ? api.resolveArtists("producer", tags(producers))
          : { data: [] },
        tags(synthesizers).length
          ? api.resolveArtists("synthesizer", tags(synthesizers))
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
      logEdit({
        targetType: "song",
        targetId: String(song.id),
        action: "edit_song",
        detail: {
          songName: song.name,
          bvids: song.videos?.map((v) => v.bvid) ?? [],
          changes: changes(),
        },
      });
      origRef.current = {
        displayName,
        type,
        vocalists,
        producers,
        synthesizers,
      };
      toast.success("歌曲信息更新成功");
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "更新失败");
      return false;
    } finally {
      setSubmitting(false);
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
    hasChanges,
    submitting,
    submit,
    changes,
  };
}
