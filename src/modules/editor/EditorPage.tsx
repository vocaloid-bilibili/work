// src/modules/editor/EditorPage.tsx
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { EditorProvider, useEditor } from "./ctx";
import { TopBar } from "./layout/TopBar";
import { Kbar } from "./layout/Kbar";
import { HomeView } from "./views/Home";
import { SongView } from "./views/Song";
import { VideoView } from "./views/Video";
import { AddView } from "./views/Add";
import { MergeSongView } from "./views/MergeSong";
import { MergeArtistView } from "./views/MergeArtist";
import { ReassignView } from "./views/Reassign";
import { BoardView } from "./views/Board";
import { SyncView } from "./views/Sync";

function Router() {
  const { view, loading } = useEditor();
  const [kbarOpen, setKbarOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setKbarOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex flex-col items-center w-full px-3 sm:px-4">
      <div className="w-full max-w-3xl">
        <TopBar onOpenSearch={() => setKbarOpen(true)} />
      </div>

      {loading && (
        <div className="flex items-center gap-2.5 text-muted-foreground py-16">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">加载中…</span>
        </div>
      )}

      <main className="w-full max-w-3xl pb-16">
        {view.id === "home" && !loading && <HomeView />}
        {view.id === "song" && <SongView song={view.song} />}
        {view.id === "video" && <VideoView video={view.video} />}
        {view.id === "add" && <AddView preset={view.preset} />}
        {view.id === "merge-song" && <MergeSongView preset={view.preset} />}
        {view.id === "merge-artist" && <MergeArtistView />}
        {view.id === "reassign" && (
          <ReassignView
            bvid={view.bvid}
            title={view.title}
            parent={view.parent}
          />
        )}
        {view.id === "board" && <BoardView />}
        {view.id === "sync" && <SyncView />}
      </main>

      <Kbar open={kbarOpen} onClose={() => setKbarOpen(false)} />
    </div>
  );
}

export default function EditorPage() {
  return (
    <EditorProvider>
      <Router />
    </EditorProvider>
  );
}
