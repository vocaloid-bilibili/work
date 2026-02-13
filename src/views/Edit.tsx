import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EditName from "@/components/EditPanels/EditName";
import EditSong from "@/components/EditPanels/EditSong";
import EditVideo from "@/components/EditPanels/EditVideo";

export default function Edit() {
  return (
    <div className="flex flex-col items-center w-full px-4">
      <div className="text-2xl font-bold my-6">编辑信息</div>
      <Tabs defaultValue="edit-artist" className="w-full max-w-4xl">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="edit-artist">艺术家</TabsTrigger>
          <TabsTrigger value="edit-song">歌曲</TabsTrigger>
          <TabsTrigger value="edit-video">视频</TabsTrigger>
        </TabsList>
        <TabsContent value="edit-artist">
          <EditName />
        </TabsContent>
        <TabsContent value="edit-song">
          <EditSong />
        </TabsContent>
        <TabsContent value="edit-video">
          <EditVideo />
        </TabsContent>
      </Tabs>
    </div>
  );
}
