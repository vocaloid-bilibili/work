// src/modules/editor/types.ts
import type { Song, Video } from "@/core/types/catalog";

export type View =
  | { id: "home" }
  | { id: "song"; song: Song }
  | { id: "video"; video: Video }
  | { id: "add"; preset?: Song }
  | { id: "merge-song"; preset?: Song }
  | { id: "merge-artist" }
  | { id: "reassign"; bvid: string; title: string; parent: Song | null }
  | { id: "board" }
  | { id: "sync" };

export const VIEW_LABEL: Record<string, string> = {
  home: "编辑工作台",
  song: "歌曲",
  video: "视频",
  add: "添加收录",
  "merge-song": "合并歌曲",
  "merge-artist": "合并艺人",
  reassign: "移动视频",
  board: "榜单视频",
  sync: "同步状态",
};
