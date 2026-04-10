// src/modules/editor/song/SongWorkspace.tsx
import { useCallback } from "react";
import { Button } from "@/ui/button";
import { GitMerge, Trash2 } from "lucide-react";
import * as api from "@/core/api/mainEndpoints";
import type { Song } from "@/core/types/catalog";
import type { EditorNav } from "../hooks/useEditorNav";
import SongHeader from "./SongHeader";
import SongForm from "./SongForm";
import SongVideos from "./SongVideos";
import SongRelationsEditor from "./relations/SongRelationsEditor";
import { useSongForm } from "./useSongForm";

interface Props {
  song: Song;
  nav: EditorNav;
  load: (type: "song" | "video", id: string | number) => Promise<void>;
  openRemove: (m: "song" | "video", s?: Song, b?: string, t?: string) => void;
}

export default function SongWorkspace({ song, nav, load, openRemove }: Props) {
  const form = useSongForm(song);

  const refresh = useCallback(async () => {
    try {
      const r = await api.selectSong(song.id);
      nav.replace({ type: "song", song: r.data });
    } catch {
      /* silent */
    }
  }, [song.id, nav]);

  return (
    <div className="space-y-4">
      <SongHeader song={song} onClose={nav.home} />
      <SongForm form={form} songName={song.name} onSubmitted={refresh} />
      <SongRelationsEditor song={song} />
      <SongVideos song={song} nav={nav} openRemove={openRemove} load={load} />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => nav.push({ type: "merge-song", presetSource: song })}
        >
          <GitMerge className="h-3.5 w-3.5" />
          合并到其他歌曲
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={() => openRemove("song", song)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          从收录移除
        </Button>
      </div>
    </div>
  );
}
