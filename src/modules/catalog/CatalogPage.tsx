// src/modules/catalog/CatalogPage.tsx

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import SongEditor from "./SongEditor";
import VideoEditor from "./VideoEditor";
import SongMerger from "./SongMerger";
import ArtistMerger from "./ArtistMerger";
import VideoReassigner from "./VideoReassigner";
import BoardVideoEditor from "./BoardVideoEditor";
import EditLogViewer from "./log";

export default function CatalogPage() {
  return (
    <div className="flex flex-col items-center w-full px-4">
      <div className="text-2xl font-bold my-6">编辑信息</div>
      <Tabs defaultValue="song" className="w-full max-w-4xl">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="song">编辑歌曲</TabsTrigger>
          <TabsTrigger value="video">编辑视频</TabsTrigger>
          <TabsTrigger value="merge-song">合并歌曲</TabsTrigger>
          <TabsTrigger value="merge-artist">合并艺人</TabsTrigger>
          <TabsTrigger value="reassign">拆分视频</TabsTrigger>
          <TabsTrigger value="board-video">榜单视频</TabsTrigger>
          <TabsTrigger value="logs">操作日志</TabsTrigger>
        </TabsList>
        <TabsContent value="song">
          <SongEditor />
        </TabsContent>
        <TabsContent value="video">
          <VideoEditor />
        </TabsContent>
        <TabsContent value="merge-song">
          <SongMerger />
        </TabsContent>
        <TabsContent value="merge-artist">
          <ArtistMerger />
        </TabsContent>
        <TabsContent value="reassign">
          <VideoReassigner />
        </TabsContent>
        <TabsContent value="board-video">
          <BoardVideoEditor />
        </TabsContent>
        <TabsContent value="logs">
          <EditLogViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
