// src/core/api/mainEndpoints.ts
import http from "./mainClient";
import type { Song, Video } from "../types/catalog";

// ── 上传 ──
export const uploadFile = (file: File, onProgress?: (p: number) => void) => {
  const fd = new FormData();
  fd.append("file", file);
  return http.post("/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 100_000,
    onUploadProgress: (e) => {
      if (e.total) onProgress?.(e.loaded / e.total);
    },
  });
};

// ── 搜索 ──
export const search = (
  type: string,
  keyword: string,
  page = 1,
  pageSize = 20,
) =>
  http
    .get(`/search/${type}`, { params: { keyword, page, page_size: pageSize } })
    .then((r) => r.data);

// ── 查询 ──
export const selectSong = (id: number) =>
  http
    .get("/select/song", { params: { id } })
    .then((r) => r.data as { data: Song });

export const selectVideo = (bvid: string) =>
  http
    .get("/select/video", { params: { bvid } })
    .then((r) => r.data as { data: Video });

export const selectArtist = (type: string, id: number) =>
  http.get("/select/artist", { params: { type, id } }).then((r) => r.data);

// ── 编辑 ──
export const editSong = (data: {
  id: number;
  display_name?: string;
  type?: string;
  vocalist_ids?: number[];
  producer_ids?: number[];
  synthesizer_ids?: number[];
}) => http.post("/edit/song", data).then((r) => r.data);

export const editVideo = (data: {
  bvid: string;
  title?: string;
  copyright?: number;
  uploader_id?: number;
  disabled?: boolean;
}) => http.post("/edit/video", data).then((r) => r.data);

export const deleteSong = (id: number) =>
  http.delete(`/edit/song/${id}`).then(
    (r) =>
      r.data as {
        status: string;
        deleted_song: number;
        deleted_videos: string[];
      },
  );

export const deleteVideo = (bvid: string) =>
  http.delete(`/edit/video/${bvid}`).then((r) => r.data);

export const mergeSong = (
  sourceId: number,
  targetId?: number,
  newSongName?: string,
) =>
  http
    .post("/edit/song/merge", {
      source_id: sourceId,
      target_id: targetId,
      new_song_name: newSongName,
    })
    .then((r) => r.data as { status: string; merged: number; into: number });

export const reassignVideo = (
  bvid: string,
  targetSongId?: number,
  newSongName?: string,
) =>
  http
    .post("/edit/video/reassign", {
      bvid,
      target_song_id: targetSongId,
      new_song_name: newSongName,
    })
    .then(
      (r) =>
        r.data as {
          status: string;
          bvid: string;
          old_song_id: number;
          new_song_id: number;
        },
    );

export const mergeArtist = (
  type: string,
  sourceId: number,
  targetId?: number,
  newArtistName?: string,
) =>
  http
    .post("/edit/artist/merge", {
      type,
      source_id: sourceId,
      target_id: targetId,
      new_artist_name: newArtistName,
    })
    .then(
      (r) =>
        r.data as {
          status: string;
          type: string;
          merged: number;
          into: number;
          songs_affected: number;
        },
    );

/**
 * 批量解析艺人名称 → { id, name }[]
 * 不存在的自动创建
 */
export const resolveArtists = (
  type: "vocalist" | "producer" | "synthesizer",
  names: string[],
) =>
  http
    .post("/edit/artist/resolve", { type, names })
    .then((r) => r.data as { data: { id: number; name: string }[] });

// ── 榜单视频 ──
export const getBoardVideo = (board: string, issue: number) =>
  http
    .get("/select/ranking/video", { params: { board, issue } })
    .then(
      (r) => r.data as { board: string; issue: number; bvid: string } | null,
    );

export const setBoardVideo = (board: string, issue: number, bvid: string) =>
  http.post("/edit/ranking/video", { board, issue, bvid }).then((r) => r.data);

// ── 检查 ──
export const checkRanking = (board: string, part: string, issue: number) =>
  http
    .get("/update/check_ranking", { params: { board, part, issue } })
    .then((r) => r.data);
// ── 歌曲关联 ──
export const getSongRelations = (songId: number) =>
  http.get("/select/song/relations", { params: { id: songId } }).then(
    (r) =>
      r.data as {
        originals: Array<{
          id: number;
          name: string;
          display_name?: string | null;
          type?: string;
          thumbnail?: string | null;
          producers?: { id: number; name: string }[];
          vocalists?: { id: number; name: string }[];
        }>;
        derivatives: Array<{
          id: number;
          name: string;
          display_name?: string | null;
          type?: string;
          thumbnail?: string | null;
          producers?: { id: number; name: string }[];
          vocalists?: { id: number; name: string }[];
        }>;
      },
  );

export const addSongRelation = (songId: number, relatedSongId: number) =>
  http
    .post("/edit/song/relation", {
      song_id: songId,
      related_song_id: relatedSongId,
    })
    .then((r) => r.data as { status: string; id: number });

export const removeSongRelation = (songId: number, relatedSongId: number) =>
  http
    .delete("/edit/song/relation", {
      params: { song_id: songId, related_song_id: relatedSongId },
    })
    .then((r) => r.data as { status: string });
export const addSongRelationBatch = (
  songId: number,
  relatedSongIds: number[],
) =>
  http
    .post("/edit/song/relation/batch", {
      song_id: songId,
      related_song_ids: relatedSongIds,
    })
    .then(
      (r) =>
        r.data as {
          status: string;
          added: number[];
          skipped: number[];
          added_count: number;
          skipped_count: number;
        },
    );
