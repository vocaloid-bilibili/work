// src/core/types/catalog.ts

export type SongType = "原创" | "翻唱" | "本家重置" | "串烧";
export type Copyright = 1 | 2 | 3 | 100 | 101;

export interface Artist {
  id: number;
  name: string;
  vocadb_id?: number | null;
}

export interface UploaderRef {
  id: number;
  name: string;
}

export interface VideoSummary {
  bvid: string;
  title: string;
  pubdate?: string | null;
  copyright?: number | null;
  thumbnail?: string | null;
  duration?: number | null;
  page?: number | null;
  song_id?: number;
  uploader_id?: number | null;
  uploader?: UploaderRef | null;
  disabled?: boolean | null;
}

export interface Song {
  id: number;
  name: string;
  display_name?: string | null;
  type: SongType;
  vocadb_id?: number | null;
  vocalists?: Artist[];
  producers?: Artist[];
  synthesizers?: Artist[];
  videos?: VideoSummary[];
}

export interface Video {
  bvid: string;
  title: string;
  pubdate?: string | null;
  copyright: Copyright;
  thumbnail?: string | null;
  duration?: number | null;
  page?: number | null;
  uploader_id?: number | null;
  song_id: number;
  disabled?: boolean | null;
  streak?: number | null;
  streak_date?: string | null;
  uploader?: UploaderRef | null;
  song?: {
    id: number;
    name: string;
    display_name?: string | null;
    type: SongType;
  } | null;
}

export const COPYRIGHT_MAP: Record<Copyright, string> = {
  1: "自制",
  2: "转载",
  3: "未定",
  101: "转载投自制",
  100: "自制投转载",
};
