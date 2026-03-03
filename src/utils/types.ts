export type SongType = "原创" | "翻唱" | "本家重置" | "串烧";
export type Copyright = 1 | 2 | 3 | 100 | 101;

export interface Artist {
  id: number;
  name: string;
}

export interface SongInfo {
  id: number;
  name: string;
  display_name?: string;
  type: SongType;
  vocalists?: Artist[];
  producers?: Artist[];
  synthesizers?: Artist[];
}

export interface VideoInfo {
  bvid: string;
  title: string;
  copyright: Copyright;
  uploader_id?: number;
  uploader_name?: string;
  disabled?: boolean;
  song_id?: number;
}
