// src/modules/stats/constants.ts
export const FIELD_LABELS: Record<string, string> = {
  name: "歌名",
  vocal: "歌手",
  author: "作者",
  synthesizer: "引擎",
  copyright: "版权",
  type: "类别",
  include: "收录开关",
  blacklist: "排除/取消排除",
};

export const FIELD_COLORS: Record<string, string> = {
  name: "text-pink-500 dark:text-pink-400",
  vocal: "text-purple-500 dark:text-purple-400",
  author: "text-orange-500 dark:text-orange-400",
  synthesizer: "text-sky-500 dark:text-sky-400",
  copyright: "text-teal-500 dark:text-teal-400",
  type: "text-indigo-500 dark:text-indigo-400",
};

export const FIELD_BADGE_STYLES: Record<string, string> = {
  name: "border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 bg-pink-50/50 dark:bg-pink-950/20",
  vocal:
    "border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20",
  author:
    "border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20",
  synthesizer:
    "border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/20",
  copyright:
    "border-teal-300 dark:border-teal-700 text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20",
  type: "border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20",
  include:
    "border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20",
  blacklist:
    "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20",
};
