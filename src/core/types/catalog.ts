// src/core/types/catalog.ts
export type SongType = "原创" | "翻唱" | "本家重置" | "串烧";
export type Copyright = 1 | 2 | 3 | 100 | 101;

export interface Artist {
  id: number;
  name: string;
}

export interface Song {
  id: number;
  name: string;
  display_name?: string;
  type: SongType;
  vocalists?: Artist[];
  producers?: Artist[];
  synthesizers?: Artist[];
}

export interface Video {
  bvid: string;
  title: string;
  copyright: Copyright;
  uploader_id?: number;
  uploader_name?: string;
  disabled?: boolean;
  song_id?: number;
}

export const COPYRIGHT_MAP: Record<Copyright, string> = {
  1: "自制",
  2: "转载",
  3: "未定",
  101: "转载投自制",
  100: "自制投转载",
};
