// src/modules/editor/song/relations/types.ts
export interface RelatedSong {
  id: number;
  name: string;
  display_name?: string | null;
  type?: string;
  thumbnail?: string | null;
  producers?: { id: number; name: string }[];
  vocalists?: { id: number; name: string }[];
}
