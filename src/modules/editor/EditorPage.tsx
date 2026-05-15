// src/modules/editor/EditorPage.tsx
import { useState, useEffect } from "react";
import { EditorProvider } from "./ctx";
import { TopBar } from "./layout/TopBar";
import { Kbar } from "./layout/Kbar";
import { HomePage } from "./pages/HomePage";
import { SongPage } from "./pages/SongPage";
import { VideoPage } from "./pages/VideoPage";
import { AddPage } from "./pages/AddPage";
import { MergeSongPage } from "./pages/MergeSongPage";
import { MergeArtistPage } from "./pages/MergeArtistPage";
import { ReassignPage } from "./pages/ReassignPage";
import { BoardPage } from "./pages/BoardPage";
import { SyncPage } from "./pages/SyncPage";
import { Routes, Route } from "react-router-dom";

function EditorLayout() {
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

      <EditorRouter />

      <Kbar open={kbarOpen} onClose={() => setKbarOpen(false)} />
    </div>
  );
}

export default function EditorPage() {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
}

export function EditorRouter() {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="song/:songId" element={<SongPage />} />
      <Route path="video/:videoId" element={<VideoPage />} />
      <Route path="add" element={<AddPage />} />
      <Route path="merge-song" element={<MergeSongPage />} />
      <Route path="merge-artist" element={<MergeArtistPage />} />
      <Route path="reassign/:bvid" element={<ReassignPage />} />
      <Route path="board" element={<BoardPage />} />
      <Route path="sync" element={<SyncPage />} />
    </Routes>
  );
}