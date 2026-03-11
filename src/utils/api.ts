// src/utils/api.ts

import axios from "axios";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import {
  clearTokens,
  getAuthHeaders,
  getValidAccessToken,
  refreshAccessToken,
} from "@/utils/auth";
import type { SongInfo, VideoInfo } from "@/utils/types";

const BASE_URL = "https://api.vocabili.top/v2";
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
});

// ── Request 拦截器：Bearer token ──
api.interceptors.request.use(async (config) => {
  const token = await getValidAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response 拦截器：401 自动刷新重试 ──
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retried) {
      original._retried = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      // 刷新失败，跳登录
      clearTokens();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

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
    mergeArtist: "/edit/artist/merge",
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
    handlers?.onStart?.();
    const abortController = new AbortController();

    (async () => {
      const headers = await getAuthHeaders();
      fetchEventSource(url, {
        method: "GET",
        headers,
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
    })();

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
    handlers?.onStart?.();
    const abortController = new AbortController();

    (async () => {
      const headers = await getAuthHeaders();
      fetchEventSource(url, {
        method: "GET",
        headers,
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
    })();

    return () => abortController.abort();
  }

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

  async editSong(data: {
    id: number;
    display_name?: string;
    type?: string;
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

  async mergeArtist(type: string, sourceId: number, targetId: number) {
    const res = await api.post(Requester.endpoint.mergeArtist, {
      type,
      source_id: sourceId,
      target_id: targetId,
    });
    return res.data;
  }
}

export default new Requester();
