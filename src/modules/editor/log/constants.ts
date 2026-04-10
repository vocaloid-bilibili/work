// src/modules/editor/log/constants.ts
export { FIELD_LABELS } from "@/core/types/constants";

export interface ActionMeta {
  label: string;
  color: string;
  dot: string;
}

export const ACTIONS: Record<string, ActionMeta> = {
  edit_song: {
    label: "编辑歌曲",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  delete_song: {
    label: "移除歌曲",
    color: "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300",
    dot: "bg-red-500",
  },
  merge_song: {
    label: "合并歌曲",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300",
    dot: "bg-purple-500",
  },
  edit_video: {
    label: "编辑视频",
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300",
    dot: "bg-cyan-500",
  },
  delete_video: {
    label: "移除视频",
    color: "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300",
    dot: "bg-red-500",
  },
  reassign_video: {
    label: "移动视频",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  merge_artist: {
    label: "合并艺人",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300",
    dot: "bg-purple-500",
  },
  set_board_video: {
    label: "设置榜单视频",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300",
    dot: "bg-green-500",
  },
  add_relation: {
    label: "添加关联",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  remove_relation: {
    label: "移除关联",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300",
    dot: "bg-orange-500",
  },
};

export const TARGET_FILTERS = [
  { value: "all", label: "全部" },
  { value: "song", label: "歌曲" },
  { value: "video", label: "视频" },
  { value: "artist", label: "艺人" },
  { value: "ranking_video", label: "榜单" },
] as const;
