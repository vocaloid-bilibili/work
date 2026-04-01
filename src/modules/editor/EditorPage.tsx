// src/modules/editor/EditorPage.tsx
import { useState, useCallback } from "react";
import { Button } from "@/ui/button";
import { History, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/core/api/mainEndpoints";
import EditorSearch from "./EditorSearch";
import SongWorkspace from "./SongWorkspace";
import VideoWorkspace from "./VideoWorkspace";
import QuickActions from "./QuickActions";
import MergeSongDialog from "./dialogs/MergeSongDialog";
import MergeArtistDialog from "./dialogs/MergeArtistDialog";
import BoardVideoDialog from "./dialogs/BoardVideoDialog";
import RemoveDialog from "./dialogs/RemoveDialog";
import ReassignDialog from "./dialogs/ReassignDialog";
import LogDrawer from "./LogDrawer";
import type { Song, Video } from "@/core/types/catalog";

type View = "idle" | "song" | "video";

export default function EditorPage() {
  const [view, setView] = useState<View>("idle");
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);

  // 弹窗状态
  const [logOpen, setLogOpen] = useState(false);
  const [mergeSongOpen, setMergeSongOpen] = useState(false);
  const [mergeSongPreset, setMergeSongPreset] = useState<Song | null>(null);
  const [mergeArtistOpen, setMergeArtistOpen] = useState(false);
  const [boardVideoOpen, setBoardVideoOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeMode, setRemoveMode] = useState<"song" | "video">("song");
  const [removeSong, setRemoveSong] = useState<Song | null>(null);
  const [removeBvid, setRemoveBvid] = useState("");
  const [removeTitle, setRemoveTitle] = useState("");
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignBvid, setReassignBvid] = useState("");
  const [reassignTitle, setReassignTitle] = useState("");
  const [reassignParent, setReassignParent] = useState<Song | null>(null);

  // 搜索回调
  const handleSelectSong = useCallback(
    async (item: { id: number; name: string }) => {
      try {
        setLoading(true);
        const r = await api.selectSong(item.id);
        setActiveSong(r.data);
        setActiveVideo(null);
        setView("song");
      } catch (err: any) {
        toast.error(
          err?.response?.data?.detail || err?.message || "获取歌曲失败",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleSelectVideo = useCallback(async (bvid: string) => {
    try {
      setLoading(true);
      const r = await api.selectVideo(bvid);
      setActiveVideo(r.data);
      setActiveSong(null);
      setView("video");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || err?.message || "获取视频失败",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSong = useCallback(async () => {
    if (!activeSong) return;
    try {
      const r = await api.selectSong(activeSong.id);
      setActiveSong(r.data);
    } catch {
      // 静默失败
    }
  }, [activeSong]);

  const handleClose = useCallback(() => {
    setView("idle");
    setActiveSong(null);
    setActiveVideo(null);
  }, []);

  // 快捷操作
  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case "merge-song":
        setMergeSongPreset(null);
        setMergeSongOpen(true);
        break;
      case "merge-artist":
        setMergeArtistOpen(true);
        break;
      case "board-video":
        setBoardVideoOpen(true);
        break;
      case "remove":
        setRemoveMode("video");
        setRemoveSong(null);
        setRemoveBvid("");
        setRemoveTitle("");
        // 直接打开不太合理——这里需要先选目标
        // 改为提示用户先搜索
        toast.info("请先搜索歌曲或输入BV号，在工作区中点击「移除」");
        break;
      case "reassign":
        toast.info("请先搜索歌曲，在视频列表中点击「拆分」");
        break;
    }
  }, []);

  // SongWorkspace 回调
  const handleMergeSong = useCallback((source: Song) => {
    setMergeSongPreset(source);
    setMergeSongOpen(true);
  }, []);

  const handleRemoveSong = useCallback((song: Song) => {
    setRemoveMode("song");
    setRemoveSong(song);
    setRemoveOpen(true);
  }, []);

  const handleReassignVideo = useCallback((bvid: string, parentSong: Song) => {
    setReassignBvid(bvid);
    setReassignTitle(
      parentSong.videos?.find((v) => v.bvid === bvid)?.title ?? "",
    );
    setReassignParent(parentSong);
    setReassignOpen(true);
  }, []);

  const handleRemoveVideo = useCallback((bvid: string, title: string) => {
    setRemoveMode("video");
    setRemoveBvid(bvid);
    setRemoveTitle(title);
    setRemoveSong(null);
    setRemoveOpen(true);
  }, []);

  const handleEditVideo = useCallback(
    async (bvid: string) => {
      await handleSelectVideo(bvid);
    },
    [handleSelectVideo],
  );

  // VideoWorkspace 回调
  const handleVideoOpenSong = useCallback(
    async (songId: number) => {
      await handleSelectSong({ id: songId, name: "" });
    },
    [handleSelectSong],
  );

  const handleVideoReassign = useCallback(
    (bvid: string, parentSong: Song | null) => {
      setReassignBvid(bvid);
      setReassignTitle(activeVideo?.title ?? "");
      setReassignParent(parentSong);
      setReassignOpen(true);
    },
    [activeVideo],
  );

  const handleVideoRemove = useCallback((bvid: string, title: string) => {
    setRemoveMode("video");
    setRemoveBvid(bvid);
    setRemoveTitle(title);
    setRemoveSong(null);
    setRemoveOpen(true);
  }, []);

  return (
    <div className="flex flex-col items-center w-full px-2 sm:px-4">
      {/* 顶栏 */}
      <div className="w-full max-w-3xl flex items-center justify-between my-4 sm:my-6">
        <h1 className="text-xl sm:text-2xl font-bold">编辑工作台</h1>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setLogOpen(true)}
        >
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">操作日志</span>
        </Button>
      </div>

      {/* 搜索栏 */}
      <EditorSearch
        className="w-full max-w-3xl"
        onSelectSong={handleSelectSong}
        onSelectVideo={handleSelectVideo}
      />

      {/* 加载指示 */}
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground mt-8">
          <Loader2 className="h-5 w-5 animate-spin" />
          加载中…
        </div>
      )}

      {/* 工作区 */}
      <div className="w-full max-w-3xl mt-6 mb-12">
        {view === "idle" && !loading && (
          <QuickActions onAction={handleQuickAction} />
        )}

        {view === "song" && activeSong && (
          <SongWorkspace
            song={activeSong}
            onRefresh={refreshSong}
            onClose={handleClose}
            onMergeSong={handleMergeSong}
            onRemoveSong={handleRemoveSong}
            onReassignVideo={handleReassignVideo}
            onRemoveVideo={handleRemoveVideo}
            onEditVideo={handleEditVideo}
          />
        )}

        {view === "video" && activeVideo && (
          <VideoWorkspace
            video={activeVideo}
            onClose={handleClose}
            onReassign={handleVideoReassign}
            onRemove={handleVideoRemove}
            onOpenSong={handleVideoOpenSong}
          />
        )}
      </div>

      {/* 弹窗们 */}
      <LogDrawer open={logOpen} onOpenChange={setLogOpen} />

      <MergeSongDialog
        open={mergeSongOpen}
        onOpenChange={setMergeSongOpen}
        presetSource={mergeSongPreset}
        onDone={() => {
          if (activeSong && mergeSongPreset?.id === activeSong.id) {
            handleClose();
          }
        }}
      />

      <MergeArtistDialog
        open={mergeArtistOpen}
        onOpenChange={setMergeArtistOpen}
      />

      <BoardVideoDialog
        open={boardVideoOpen}
        onOpenChange={setBoardVideoOpen}
      />

      <RemoveDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        mode={removeMode}
        song={removeSong}
        bvid={removeBvid}
        videoTitle={removeTitle}
        onDone={() => {
          if (removeMode === "song" && removeSong?.id === activeSong?.id) {
            handleClose();
          } else {
            refreshSong();
          }
        }}
      />

      <ReassignDialog
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        bvid={reassignBvid}
        videoTitle={reassignTitle}
        parentSong={reassignParent}
        onDone={() => {
          refreshSong();
        }}
      />
    </div>
  );
}
