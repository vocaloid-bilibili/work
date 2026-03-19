import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlayCircle, Loader2, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";

interface Props {
  record: any;
  blacklisted: boolean;
}

export default function CardCover({ record, blacklisted }: Props) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const loadVideoPreview = async () => {
    if (videoUrl) return;
    const bvid = record.bvid || (record.aid ? `av${record.aid}` : "");
    if (!bvid) {
      toast.error("无法获取视频ID");
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await axios.get(
        `https://api.xingzhige.com/API/b_parse/?url=https://www.bilibili.com/video/${bvid}`,
      );
      if (res.data?.code === 0 && res.data.data?.video?.url)
        setVideoUrl(res.data.data.video.url);
      else toast.error("解析视频失败: " + (res.data?.msg || "未知错误"));
    } catch {
      toast.error("请求视频解析接口失败");
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="relative group rounded-xl overflow-hidden border shadow-sm">
      <a
        href={`https://www.bilibili.com/video/${record.bvid || "av" + record.aid}`}
        target="_blank"
        rel="noreferrer"
        className="block"
      >
        <img
          src={record.image_url}
          alt={record.title}
          className={cn(
            "w-full object-cover aspect-video transition-all",
            blacklisted && "opacity-40 grayscale",
          )}
          referrerPolicy="no-referrer"
        />
      </a>
      {blacklisted && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Badge variant="destructive" className="text-sm px-3 py-1 shadow-lg">
            <Ban className="h-3.5 w-3.5 mr-1" />
            已排除
          </Badge>
        </div>
      )}
      <Dialog
        open={isPreviewOpen}
        onOpenChange={(open) => {
          setIsPreviewOpen(open);
          if (open) loadVideoPreview();
        }}
      >
        <DialogTrigger asChild>
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            title="预览视频"
          >
            <PlayCircle className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{record.title}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full bg-black flex items-center justify-center rounded-md overflow-hidden">
            {previewLoading ? (
              <div className="flex flex-col items-center text-white gap-2">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">正在解析...</span>
              </div>
            ) : videoUrl ? (
              <video src={videoUrl} controls autoPlay className="w-full h-full">
                不支持播放
              </video>
            ) : (
              <div className="text-white text-sm">无法加载视频</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
