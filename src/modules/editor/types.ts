// src/modules/editor/types.ts
import type { Song, Video } from "@/core/types/catalog";

export type ViewState =
  | { type: "idle" }
  | { type: "song"; song: Song }
  | { type: "video"; video: Video }
  | { type: "logs" }
  | { type: "merge-song"; presetSource?: Song }
  | { type: "merge-artist" }
  | { type: "board-video" }
  | {
      type: "reassign";
      bvid: string;
      videoTitle: string;
      parentSong: Song | null;
    }
  | { type: "add"; presetSong?: Song };

export const VIEW_TITLES: Record<string, string> = {
  idle: "编辑工作台",
  song: "歌曲",
  video: "视频",
  logs: "操作日志",
  "merge-song": "合并歌曲",
  "merge-artist": "合并艺人",
  "board-video": "榜单视频",
  reassign: "拆分/移动视频",
  add: "添加收录",
};
