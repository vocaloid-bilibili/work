// src/modules/marking/publish/usePublishRelations.ts
import { useCallback, useEffect, useRef } from "react";
import * as api from "@/core/api/mainEndpoints";
import type { Row } from "@/core/types/collab";
import type { Song } from "@/core/types/catalog";

interface LinkedSong {
  id: number;
  name: string;
}

function parseOriginals(raw: unknown): LinkedSong[] {
  if (!raw) return [];
  try {
    const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function usePublishRelations(
  records: Row[],
  includes: boolean[],
  log: (msg: string) => void,
) {
  const recordsRef = useRef(records);
  const includesRef = useRef(includes);
  useEffect(() => {
    recordsRef.current = records;
  }, [records]);
  useEffect(() => {
    includesRef.current = includes;
  }, [includes]);

  const linkOriginals = useCallback(
    async (signal: AbortSignal) => {
      const recs = recordsRef.current;
      const incs = includesRef.current;

      const candidates = recs
        .map((r, i) => ({ record: r, index: i }))
        .filter(
          ({ record, index }) =>
            incs[index] && parseOriginals(record._original).length > 0,
        );

      if (candidates.length === 0) return;

      log(`创建关联关系 (${candidates.length} 首)…`);
      let ok = 0;
      let fail = 0;

      for (const { record } of candidates) {
        if (signal.aborted) break;
        const originals = parseOriginals(record._original);
        const songName = String(record.name || "").trim();
        if (!songName) continue;

        try {
          const searchResult = (await api.search("song", songName, 1, 10)) as {
            data?: Song[];
          };
          const songs = Array.isArray(searchResult.data)
            ? searchResult.data
            : [];
          const song = songs.find(
            (s) =>
              s.name === songName || (s.display_name || s.name) === songName,
          );

          if (!song) {
            log(`  ✗「${songName}」未找到对应歌曲，跳过`);
            fail++;
            continue;
          }

          for (const orig of originals) {
            try {
              await api.addSongRelation(orig.id, song.id);
              log(`  ✓「${songName}」→ 原曲「${orig.name}」`);
              ok++;
            } catch {
              log(`  ✗「${songName}」→「${orig.name}」失败`);
              fail++;
            }
          }
        } catch {
          log(`  ✗ 搜索「${songName}」失败`);
          fail++;
        }
      }

      log(`关联创建完成：${ok} 成功${fail > 0 ? `，${fail} 失败` : ""}`);
    },
    [log],
  );

  return { linkOriginals };
}
