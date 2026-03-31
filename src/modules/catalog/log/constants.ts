// src/modules/catalog/log/constants.ts

export const ACTION_LABELS: Record<string, string> = {
  edit_song: "编辑歌曲",
  delete_song: "删除歌曲",
  merge_song: "合并歌曲",
  edit_video: "编辑视频",
  delete_video: "删除视频",
  reassign_video: "移动视频",
  merge_artist: "合并艺人",
  set_board_video: "设置榜单视频",
};

export const ACTION_COLORS: Record<string, string> = {
  edit_song: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  delete_song: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  merge_song:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  edit_video: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  delete_video: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  reassign_video:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  merge_artist:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  set_board_video:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export const TARGET_LABELS: Record<string, string> = {
  song: "歌曲",
  video: "视频",
  artist: "艺人",
  ranking_video: "榜单视频",
};
