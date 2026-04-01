// src/core/types/constants.ts
import type { SongType } from "./catalog";

type Entry<V = string | number> = readonly {
  readonly value: V;
  readonly label: string;
}[];

function toMap<V extends string | number>(
  entries: Entry<V>,
): Record<string, string> {
  return Object.fromEntries(entries.map((e) => [String(e.value), e.label]));
}

export const COPYRIGHT = [
  { value: 1, label: "自制" },
  { value: 2, label: "转载" },
  { value: 3, label: "未定" },
  { value: 101, label: "转载投自制" },
  { value: 100, label: "自制投转载" },
] as const;

export const COPYRIGHT_MAP = toMap(COPYRIGHT);

export const SONG_TYPES: SongType[] = ["原创", "翻唱", "本家重置", "串烧"];

export const ARTIST_TYPES = [
  { value: "vocalist", label: "歌手", col: "vocal" },
  { value: "producer", label: "作者", col: "author" },
  { value: "synthesizer", label: "引擎", col: "synthesizer" },
] as const;

export type ArtistType = (typeof ARTIST_TYPES)[number]["value"];

export const BOARDS = [
  { value: "vocaloid-daily", label: "日刊" },
  { value: "vocaloid-weekly", label: "周刊" },
  { value: "vocaloid-monthly", label: "月刊" },
] as const;

export const PARTS = [
  { value: "main", label: "主榜" },
  { value: "new", label: "新曲榜" },
] as const;

export const FIELD_LABELS: Record<string, string> = {
  name: "歌名",
  display_name: "显示名",
  type: "歌曲类型",
  vocal: "歌手",
  author: "作者",
  synthesizer: "引擎",
  title: "标题",
  copyright: "视频类型",
  disabled: "禁用",
};
