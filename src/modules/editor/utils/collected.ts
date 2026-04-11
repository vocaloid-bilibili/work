// src/modules/editor/utils/collected.ts

import type { Song, Video } from "@/core/types/catalog";
import type { BilibiliVideoInfo, CollectedRow } from "@/core/api/mainEndpoints";

function fmtPubdate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso)
      .toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/\//g, "-");
  } catch {
    return "";
  }
}

export function buildCollectedRow(
  video: Video,
  song: Song | null,
  bilibili?: BilibiliVideoInfo | null,
): CollectedRow {
  return {
    title: video.title,
    bvid: video.bvid,
    aid: bilibili?.aid ?? "",
    name: song ? song.display_name?.trim() || song.name : "",
    view: bilibili?.stat?.view ?? 0,
    pubdate: fmtPubdate(video.pubdate),
    author: song?.producers?.map((p) => p.name).join("、") ?? "",
    uploader: video.uploader?.name ?? "",
    copyright: video.copyright ?? 1,
    synthesizer: song?.synthesizers?.map((s) => s.name).join("、") ?? "",
    vocal: song?.vocalists?.map((v) => v.name).join("、") ?? "",
    type: song?.type ?? "",
    image_url: video.thumbnail ?? "",
    streak: 0,
  };
}
