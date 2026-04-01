// src/modules/editor/song/SongVideos.tsx
import { useState } from "react";
import { Card, CardContent } from "@/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import VideoRow from "./VideoRow";
import type { Song } from "@/core/types/catalog";
import type { EditorNav } from "../hooks/useEditorNav";

interface Props {
  song: Song;
  nav: EditorNav;
  openRemove: (m: "song" | "video", s?: Song, b?: string, t?: string) => void;
  load: (type: "song" | "video", id: string | number) => Promise<void>;
}

export default function SongVideos({ song, nav, openRemove, load }: Props) {
  const [expanded, setExpanded] = useState(true);
  const videos = song.videos ?? [];
  if (videos.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-4">
        <button
          className="flex items-center justify-between w-full text-sm font-medium mb-2"
          onClick={() => setExpanded((v) => !v)}
        >
          <span>关联视频 ({videos.length})</span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {expanded && (
          <div className="space-y-2">
            {videos.map((v) => (
              <VideoRow
                key={v.bvid}
                video={v}
                onEdit={() => load("video", v.bvid)}
                onReassign={() =>
                  nav.push({
                    type: "reassign",
                    bvid: v.bvid,
                    videoTitle: v.title,
                    parentSong: song,
                  })
                }
                onRemove={() => openRemove("video", undefined, v.bvid, v.title)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
