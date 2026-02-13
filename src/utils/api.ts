import axios from "axios";
import type { SongInfo, VideoInfo } from "@/utils/types";

const BASE_URL = "https://api.vocabili.top/v2"

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

class Requester {
  static endpoint = {
    uploadFile: "/upload",
    checkFile: "/upload/check",
    updateRanking: "/update/ranking",
    updateSnapshot: "/update/snapshot",
    editArtistCheck: "/edit/artist/check",
    editArtistConfirm: "/edit/artist/confirm",
    editSong: "/edit/song",
    editVideo: "/edit/video",
    search: (type: string) => `/search/${type}`,
    selectArtist: `/select/artist`,
    selectSong: `/select/song`,
    selectVideo: `/select/video`,
  }

  constructor() {}

  async uploadFile(
    file: File,
    handlers?: {
      onProgress?: (progress: number) => void;
    }) {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(Requester.endpoint.uploadFile, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (evt) => {
        if (evt.total && evt.loaded) {
          const progress = evt.loaded / evt.total;
          handlers?.onProgress?.(progress);
        }
      },
      timeout: 100000
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
      onError?: (err: Event) => void;
    }
  ) {
    // Note: EventSource might not send custom headers or handle POSTs with body easily.
    // Ensure the backend endpoint supports GET query params as constructed here.
    const url = `${BASE_URL}${Requester.endpoint.updateRanking}?board=${board}&part=${part}&issue=${issue}${old ? '&old=true' : ''}`;
    const es = new EventSource(url);

    if (handlers?.onStart) {
        handlers.onStart();
    }

    es.onmessage = (e) => {
        // Some backends send data in 'message' event, others in custom events.
        // If standard 'message' event is used:
        handlers?.onProgress?.(e.data);
    };

    // If backend sends specific events named "progress" or "complete":
    es.addEventListener("progress", (e: MessageEvent) => {
      handlers?.onProgress?.(e.data);
    });

    es.addEventListener("complete", (e: MessageEvent) => {
      handlers?.onComplete?.(e.data);
      es.close(); 
    });

    es.onerror = (e) => {
      if (es.readyState !== EventSource.CLOSED) {
        handlers?.onError?.(e);
      }
      es.close(); // Safety close on error to prevent infinite retries if needed
    };

    return () => es.close(); 
  }


  async updateSnapshot(date: string, old?: boolean) {
    const res = await api.get(Requester.endpoint.updateSnapshot, {
      params: { date, old },
      timeout: 100000, 
    });
    return res.data;
  }


  async editArtistCheck(type: string, id: number, name: string) {
    const res = await api.post(Requester.endpoint.editArtistCheck, { type, id, name });
    return res.data
  }

  async editArtistConfirm(task_id: string) {
    return api.post(Requester.endpoint.editArtistConfirm, { task_id });
  }

  async search(type: string, keyword: string, page = 1, pageSize = 20): Promise<any> {
    const res =  await api.get(Requester.endpoint.search(type), {
      params: { keyword, page, page_size: pageSize }
    })
    return res.data
  }

  async selectArtist(type: string, id: number) {
    const res = await api.get(Requester.endpoint.selectArtist, {
      params: { type, id }
    });
    return res.data
  }

  async selectSong(id: number): Promise<{data: SongInfo}> {
    const res = await api.get(Requester.endpoint.selectSong, {
      params: { id }
    });
    return res.data
  }

  async editSong(song: SongInfo) {
    // Some APIs expect ID in URL or query, others in body. Assuming body based on usage.
    const res = await api.post(Requester.endpoint.editSong, song);
    return res.data
  }

  async selectVideo(bvid: string): Promise<{data: VideoInfo}> {
    const res = await api.get(Requester.endpoint.selectVideo, {
      params: { bvid }
    });
    return res.data
  }

  async editVideo(video: VideoInfo) {
    const res = await api.post(Requester.endpoint.editVideo, video);
    return res.data
  }
}

export default new Requester();
