// src/modules/editor/EditorPage.tsx
import { useState, useCallback } from "react";
import { Button } from "@/ui/button";
import { ArrowLeft, History, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import { useEditorNav } from "./hooks/useEditorNav";
import { VIEW_TITLES } from "./types";
import EditorSearch from "./EditorSearch";
import QuickActions from "./QuickActions";
import SongWorkspace from "./song/SongWorkspace";
import VideoWorkspace from "./video/VideoWorkspace";
import MergeSongPanel from "./panels/MergeSongPanel";
import MergeArtistPanel from "./panels/MergeArtistPanel";
import BoardVideoPanel from "./panels/BoardVideoPanel";
import ReassignPanel from "./panels/ReassignPanel";
import RemoveDialog from "./dialogs/RemoveDialog";
import EditLogViewer from "./log";
import type { Song } from "@/core/types/catalog";

export default function EditorPage() {
  const nav = useEditorNav();
  const [loading, setLoading] = useState(false);
  const [rmOpen, setRmOpen] = useState(false);
  const [rmMode, setRmMode] = useState<"song" | "video">("song");
  const [rmSong, setRmSong] = useState<Song | null>(null);
  const [rmBvid, setRmBvid] = useState("");
  const [rmTitle, setRmTitle] = useState("");

  const load = useCallback(
    async (type: "song" | "video", id: string | number) => {
      setLoading(true);
      try {
        if (type === "song") {
          const r = await api.selectSong(Number(id));
          nav.resetTo({ type: "song", song: r.data });
        } else {
          const r = await api.selectVideo(String(id));
          nav.resetTo({ type: "video", video: r.data });
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || "加载失败");
      } finally {
        setLoading(false);
      }
    },
    [nav],
  );

  const openRemove = useCallback(
    (m: "song" | "video", s?: Song, b?: string, t?: string) => {
      setRmMode(m);
      setRmSong(s ?? null);
      setRmBvid(b ?? "");
      setRmTitle(t ?? "");
      setRmOpen(true);
    },
    [],
  );

  const onQuick = useCallback(
    (a: string) => {
      if (a === "merge-song") nav.push({ type: "merge-song" });
      else if (a === "merge-artist") nav.push({ type: "merge-artist" });
      else if (a === "board-video") nav.push({ type: "board-video" });
      else toast.info("请先搜索歌曲或输入BV号");
    },
    [nav],
  );

  const v = nav.current;
  const showSearch =
    v.type === "idle" || v.type === "song" || v.type === "video";

  return (
    <div className="flex flex-col items-center w-full px-2 sm:px-4">
      <div className="w-full max-w-3xl flex items-center justify-between my-4 sm:my-6">
        <div className="flex items-center gap-2 min-w-0">
          {nav.canGoBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={nav.pop}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-xl sm:text-2xl font-bold truncate">
            {VIEW_TITLES[v.type] ?? "编辑工作台"}
          </h1>
        </div>
        {v.type !== "logs" && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => nav.push({ type: "logs" })}
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">日志</span>
          </Button>
        )}
      </div>

      {showSearch && (
        <EditorSearch
          className="w-full max-w-3xl"
          onSelectSong={(s) => load("song", s.id)}
          onSelectVideo={(b) => load("video", b)}
        />
      )}
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground mt-8">
          <Loader2 className="h-5 w-5 animate-spin" />
          加载中…
        </div>
      )}

      <div className="w-full max-w-3xl mt-6 mb-12">
        {v.type === "idle" && !loading && <QuickActions onAction={onQuick} />}
        {v.type === "song" && (
          <SongWorkspace
            song={v.song}
            nav={nav}
            load={load}
            openRemove={openRemove}
          />
        )}
        {v.type === "video" && (
          <VideoWorkspace
            video={v.video}
            nav={nav}
            load={load}
            openRemove={openRemove}
          />
        )}
        {v.type === "logs" && <EditLogViewer />}
        {v.type === "merge-song" && (
          <MergeSongPanel
            presetSource={v.presetSource}
            onDone={nav.pop}
            onCancel={nav.pop}
          />
        )}
        {v.type === "merge-artist" && (
          <MergeArtistPanel onDone={nav.pop} onCancel={nav.pop} />
        )}
        {v.type === "board-video" && <BoardVideoPanel />}
        {v.type === "reassign" && (
          <ReassignPanel
            bvid={v.bvid}
            videoTitle={v.videoTitle}
            parentSong={v.parentSong}
            onDone={nav.pop}
            onCancel={nav.pop}
          />
        )}
      </div>

      <RemoveDialog
        open={rmOpen}
        onOpenChange={setRmOpen}
        mode={rmMode}
        song={rmSong}
        bvid={rmBvid}
        videoTitle={rmTitle}
        onDone={() => {
          if (
            rmMode === "song" &&
            rmSong?.id === (v.type === "song" ? v.song.id : -1)
          )
            nav.home();
        }}
      />
    </div>
  );
}
