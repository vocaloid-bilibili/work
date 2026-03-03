// src/views/Edit.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EditSong from "@/components/EditPanels/EditSong";
import EditVideo from "@/components/EditPanels/EditVideo";
import MergeSong from "@/components/EditPanels/MergeSong";
import MergeArtist from "@/components/EditPanels/MergeArtist";
import ReassignVideo from "@/components/EditPanels/ReassignVideo";

export default function Edit() {
  return (
    <div className="flex flex-col items-center w-full px-4">
      <div className="text-2xl font-bold my-6">编辑信息</div>
      <Tabs defaultValue="edit-song" className="w-full max-w-4xl">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="edit-song">编辑歌曲</TabsTrigger>
          <TabsTrigger value="edit-video">编辑视频</TabsTrigger>
          <TabsTrigger value="merge-song">合并歌曲</TabsTrigger>
          <TabsTrigger value="merge-artist">合并艺人</TabsTrigger>
          <TabsTrigger value="reassign-video">拆分视频</TabsTrigger>
        </TabsList>
        <TabsContent value="edit-song">
          <EditSong />
        </TabsContent>
        <TabsContent value="edit-video">
          <EditVideo />
        </TabsContent>
        <TabsContent value="merge-song">
          <MergeSong />
        </TabsContent>
        <TabsContent value="merge-artist">
          <MergeArtist />
        </TabsContent>
        <TabsContent value="reassign-video">
          <ReassignVideo />
        </TabsContent>
      </Tabs>
    </div>
  );
}
