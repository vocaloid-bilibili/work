// src/modules/stats/actions.ts
import {
  CircleCheckBig,
  Ban,
  Pencil,
  Wrench,
  GitMerge,
  Users,
  Trash2,
  ArrowRightLeft,
  Tv,
  Link2,
  Unlink,
  Plus,
} from "lucide-react";

type LI = typeof CircleCheckBig;

export interface ActionDef {
  key: string;
  label: string;
  Icon: LI;
  category: "mark" | "edit";
  color: string;
  bg: string;
  border: string;
  dot: string;
  bar: string;
}

export const ACTIONS: Record<string, ActionDef> = {
  mark_include: {
    key: "mark_include",
    label: "收录",
    Icon: CircleCheckBig,
    category: "mark",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-l-emerald-500",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
  },
  mark_exclude: {
    key: "mark_exclude",
    label: "排除",
    Icon: Ban,
    category: "mark",
    color: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-l-rose-500",
    dot: "bg-rose-500",
    bar: "bg-rose-500",
  },
  mark_field_edit: {
    key: "mark_field_edit",
    label: "编辑字段",
    Icon: Pencil,
    category: "mark",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-l-sky-500",
    dot: "bg-sky-500",
    bar: "bg-sky-500",
  },

  add_song: {
    key: "add_song",
    label: "创建歌曲",
    Icon: Plus,
    category: "edit",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10",
    border: "border-l-green-500",
    dot: "bg-green-500",
    bar: "bg-green-500",
  },
  add_video: {
    key: "add_video",
    label: "添加视频",
    Icon: Plus,
    category: "edit",
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-l-teal-500",
    dot: "bg-teal-500",
    bar: "bg-teal-500",
  },
  add_relation: {
    key: "add_relation",
    label: "添加关联",
    Icon: Link2,
    category: "edit",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-l-cyan-500",
    dot: "bg-cyan-500",
    bar: "bg-cyan-500",
  },

  delete_song: {
    key: "delete_song",
    label: "删除歌曲",
    Icon: Trash2,
    category: "edit",
    color: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-l-rose-500",
    dot: "bg-rose-500",
    bar: "bg-rose-400",
  },
  delete_video: {
    key: "delete_video",
    label: "删除视频",
    Icon: Trash2,
    category: "edit",
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-l-red-500",
    dot: "bg-red-500",
    bar: "bg-red-500",
  },
  remove_relation: {
    key: "remove_relation",
    label: "移除关联",
    Icon: Unlink,
    category: "edit",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-l-orange-500",
    dot: "bg-orange-500",
    bar: "bg-orange-500",
  },

  edit_song: {
    key: "edit_song",
    label: "编辑歌曲",
    Icon: Pencil,
    category: "edit",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-l-blue-500",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
  },
  edit_video: {
    key: "edit_video",
    label: "编辑视频",
    Icon: Pencil,
    category: "edit",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-l-indigo-500",
    dot: "bg-indigo-500",
    bar: "bg-indigo-500",
  },
  reassign_video: {
    key: "reassign_video",
    label: "移动视频",
    Icon: ArrowRightLeft,
    category: "edit",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-l-violet-500",
    dot: "bg-violet-500",
    bar: "bg-violet-500",
  },
  set_board_video: {
    key: "set_board_video",
    label: "设置榜单",
    Icon: Tv,
    category: "edit",
    color: "text-blue-500 dark:text-blue-300",
    bg: "bg-blue-400/10",
    border: "border-l-blue-400",
    dot: "bg-blue-400",
    bar: "bg-blue-400",
  },

  merge_song: {
    key: "merge_song",
    label: "合并歌曲",
    Icon: GitMerge,
    category: "edit",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-l-purple-500",
    dot: "bg-purple-500",
    bar: "bg-purple-500",
  },
  merge_artist: {
    key: "merge_artist",
    label: "合并艺人",
    Icon: Users,
    category: "edit",
    color: "text-fuchsia-600 dark:text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
    border: "border-l-fuchsia-500",
    dot: "bg-fuchsia-500",
    bar: "bg-fuchsia-500",
  },
};

export const FALLBACK: ActionDef = {
  key: "_",
  label: "操作",
  Icon: Wrench,
  category: "edit",
  color: "text-zinc-500",
  bg: "bg-zinc-500/10",
  border: "border-l-zinc-400",
  dot: "bg-zinc-400",
  bar: "bg-zinc-400",
};

export const MARK_ACTIONS = Object.values(ACTIONS).filter(
  (a) => a.category === "mark",
);
export const EDIT_ACTIONS = Object.values(ACTIONS).filter(
  (a) => a.category === "edit",
);

export function getAction(key: string): ActionDef {
  return ACTIONS[key] || FALLBACK;
}
