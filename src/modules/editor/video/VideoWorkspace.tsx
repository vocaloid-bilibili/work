// src/modules/editor/video/VideoWorkspace.tsx
import { useState, useEffect } from "react";
import { Button } from "@/ui/button";
import { ArrowRightLeft, Trash2 } from "lucide-react";
import * as api from "@/core/api/mainEndpoints";
import type { Song, Video } from "@/core/types/catalog";
import type { EditorNav } from "../hooks/useEditorNav";
import SongInfoCard from "../shared/SongInfoCard";
import VideoHeader from "./VideoHeader";
import VideoForm from "./VideoForm";
import { useVideoForm } from "./useVideoForm";

interface Props {
  video: Video;
  nav: EditorNav;
  load: (type: "song" | "video", id: string | number) => Promise<void>;
  openRemove: (m: "song" | "video", s?: Song, b?: string, t?: string) => void;
}

export default function VideoWorkspace({
  video,
  nav,
  load,
  openRemove,
}: Props) {
  const form = useVideoForm(video);
  const [parent, setParent] = useState<Song | null>(null);

  useEffect(() => {
    if (!video.song_id) {
      setParent(null);
      return;
    }
    let c = false;
    api
      .selectSong(video.song_id)
      .then((r) => {
        if (!c) setParent(r.data);
      })
      .catch(() => {
        if (!c) setParent(null);
      });
    return () => {
      c = true;
    };
  }, [video.song_id]);

  return (
    <div className="space-y-4">
      <VideoHeader video={video} onClose={nav.canGoBack ? nav.pop : nav.home} />
      {parent && (
        <div
          className="cursor-pointer hover:opacity-80"
          onClick={() => load("song", parent.id)}
        >
          <SongInfoCard song={parent} />
          <p className="text-[10px] text-muted-foreground mt-1">
            点击切换到歌曲编辑
          </p>
        </div>
      )}
      <VideoForm form={form} bvid={video.bvid} onSubmitted={() => {}} />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            nav.push({
              type: "reassign",
              bvid: video.bvid,
              videoTitle: video.title,
              parentSong: parent,
            })
          }
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          拆分/移动到其他歌曲
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={() =>
            openRemove("video", undefined, video.bvid, video.title)
          }
        >
          <Trash2 className="h-3.5 w-3.5" />
          从收录移除
        </Button>
      </div>
    </div>
  );
}
