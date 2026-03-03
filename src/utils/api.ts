import axios from "axios";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { SongInfo, VideoInfo } from "@/utils/types";

const BASE_URL = "https://api.vocabili.top/v2";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem("x-api-key");
  if (apiKey) {
    config.headers["x-api-key"] = apiKey;
  }
  return config;
});

class Requester {
  static endpoint = {
    uploadFile: "/upload",
    checkFile: "/update/check_ranking",
    updateRanking: "/update/ranking",
    updateSnapshot: "/update/snapshots",
    editSong: "/edit/song",
    deleteSong: (id: number) => `/edit/song/${id}`,
    mergeSong: "/edit/song/merge",
    editVideo: "/edit/video",
    deleteVideo: (bvid: string) => `/edit/video/${bvid}`,
    reassignVideo: "/edit/video/reassign",
    search: (type: string) => `/search/${type}`,
    selectArtist: `/select/artist`,
    selectSong: `/select/song`,
    selectVideo: `/select/video`,
  };

  async uploadFile(
    file: File,
    handlers?: { onProgress?: (progress: number) => void },
  ) {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(Requester.endpoint.uploadFile, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (evt.total && evt.loaded) {
          handlers?.onProgress?.(evt.loaded / evt.total);
        }
      },
      timeout: 100000,
    });
  }

  async checkFile(board: string, part: string, issue: number) {
    const res = await api.get(Requester.endpoint.checkFile, {
      params: { board, part, issue },
    });
    return res.data;
  }

  updateRanking(
    board: string,
    part: string,
    issue: number,
    old?: boolean,
    handlers?: {
      onStart?: () => void;
      onProgress?: (data: string) => void;
      onComplete?: (data?: string) => void;
      onError?: (err: unknown) => void;
    },
  ) {
    const url = `${BASE_URL}${Requester.endpoint.updateRanking}?board=${board}&part=${part}&issue=${issue}${old ? "&old=true" : ""}`;
    const apiKey = localStorage.getItem("x-api-key") || "";
    handlers?.onStart?.();
    const abortController = new AbortController();

    fetchEventSource(url, {
      method: "GET",
      headers: { "x-api-key": apiKey },
      signal: abortController.signal,
      async onopen(response) {
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
      },
      onmessage(ev) {
        if (ev.event === "progress") handlers?.onProgress?.(ev.data);
        else if (ev.event === "complete") {
          handlers?.onComplete?.(ev.data);
          abortController.abort();
        } else if (ev.event === "error") {
          handlers?.onError?.(new Error(ev.data));
          abortController.abort();
        }
      },
      onerror(err) {
        handlers?.onError?.(err);
        abortController.abort();
        throw err;
      },
      openWhenHidden: true,
    }).catch((err) => {
      if (err.name !== "AbortError") handlers?.onError?.(err);
    });

    return () => abortController.abort();
  }

  updateSnapshot(
    date: string,
    old?: boolean,
    handlers?: {
      onStart?: () => void;
      onProgress?: (data: string) => void;
      onComplete?: (data?: string) => void;
      onError?: (err: unknown) => void;
    },
  ) {
    const url = `${BASE_URL}${Requester.endpoint.updateSnapshot}?date=${date}${old ? "&old=true" : ""}`;
    const apiKey = localStorage.getItem("x-api-key") || "";
    handlers?.onStart?.();
    const abortController = new AbortController();

    fetchEventSource(url, {
      method: "GET",
      headers: { "x-api-key": apiKey },
      signal: abortController.signal,
      async onopen(response) {
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
      },
      onmessage(ev) {
        if (ev.event === "progress") handlers?.onProgress?.(ev.data);
        else if (ev.event === "complete") {
          handlers?.onComplete?.(ev.data);
          abortController.abort();
        } else if (ev.event === "error") {
          handlers?.onError?.(new Error(ev.data));
          abortController.abort();
        }
      },
      onerror(err) {
        handlers?.onError?.(err);
        abortController.abort();
        throw err;
      },
      openWhenHidden: true,
    }).catch((err) => {
      if (err.name !== "AbortError") handlers?.onError?.(err);
    });

    return () => abortController.abort();
  }

  // ===== 查询 =====
  async search(type: string, keyword: string, page = 1, pageSize = 20) {
    const res = await api.get(Requester.endpoint.search(type), {
      params: { keyword, page, page_size: pageSize },
    });
    return res.data;
  }

  async selectArtist(type: string, id: number) {
    const res = await api.get(Requester.endpoint.selectArtist, {
      params: { type, id },
    });
    return res.data;
  }

  async selectSong(id: number): Promise<{ data: SongInfo }> {
    const res = await api.get(Requester.endpoint.selectSong, {
      params: { id },
    });
    return res.data;
  }

  async selectVideo(bvid: string): Promise<{ data: VideoInfo }> {
    const res = await api.get(Requester.endpoint.selectVideo, {
      params: { bvid },
    });
    return res.data;
  }

  // ===== 歌曲编辑 =====
  async editSong(data: {
    id: number;
    display_name?: string;
    type?: string;
    vocadb_id?: number | null;
    vocalist_ids?: number[];
    producer_ids?: number[];
    synthesizer_ids?: number[];
  }) {
    const res = await api.post(Requester.endpoint.editSong, data);
    return res.data;
  }

  async deleteSong(id: number) {
    const res = await api.delete(Requester.endpoint.deleteSong(id));
    return res.data;
  }

  async mergeSong(sourceId: number, targetId: number) {
    const res = await api.post(Requester.endpoint.mergeSong, {
      source_id: sourceId,
      target_id: targetId,
    });
    return res.data;
  }

  // ===== 视频编辑 =====
  async editVideo(data: {
    bvid: string;
    title?: string;
    copyright?: number;
    uploader_id?: number;
    disabled?: boolean;
  }) {
    const res = await api.post(Requester.endpoint.editVideo, data);
    return res.data;
  }

  async deleteVideo(bvid: string) {
    const res = await api.delete(Requester.endpoint.deleteVideo(bvid));
    return res.data;
  }

  async reassignVideo(
    bvid: string,
    targetSongId?: number,
    newSongName?: string,
  ) {
    const res = await api.post(Requester.endpoint.reassignVideo, {
      bvid,
      target_song_id: targetSongId,
      new_song_name: newSongName,
    });
    return res.data;
  }
}

export default new Requester();
