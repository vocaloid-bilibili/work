// src/modules/marking/publish/usePublishVocalSupport.ts
import { useCallback, useEffect, useRef } from "react";
import * as api from "@/core/api/mainEndpoints";
import type { Row } from "@/core/types/collab";
import type { Song } from "@/core/types/catalog";

function parseSupportNames(raw: unknown): string[] {
  if (!raw) return [];
  try {
    const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function splitVocal(vocal: string): string[] {
  return vocal
    .split(/[、]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function usePublishVocalSupport(
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

  const applyVocalSupport = useCallback(
    async (signal: AbortSignal) => {
      const recs = recordsRef.current;
      const incs = includesRef.current;

      // 找出有 _vocal_support 且收录的记录
      const candidates = recs
        .map((r, i) => ({ record: r, index: i }))
        .filter(({ record, index }) => {
          if (!incs[index]) return false;
          const support = parseSupportNames(record._vocal_support);
          if (support.length === 0) return false;
          // vocal 至少 2 人才有意义
          const names = splitVocal(String(record.vocal ?? ""));
          return names.length >= 2;
        });

      if (candidates.length === 0) return;

      log(`设置和声标记 (${candidates.length} 首)…`);
      let ok = 0;
      let fail = 0;

      for (const { record } of candidates) {
        if (signal.aborted) break;
        const songName = String(record.name ?? "").trim();
        if (!songName) continue;

        const supportNames = new Set(parseSupportNames(record._vocal_support));
        const allVocalNames = splitVocal(String(record.vocal ?? ""));

        // 只保留 vocal 里存在的 support name
        const validSupport = new Set(
          [...supportNames].filter((n) => allVocalNames.includes(n)),
        );
        if (validSupport.size === 0) continue;

        try {
          // 搜索歌曲
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
            log(`  ✗「${songName}」未找到，跳过和声标记`);
            fail++;
            continue;
          }

          // 获取完整歌曲数据（带 vocalist IDs）
          const detail = await api.selectSong(song.id);
          const vocalists = detail.data.vocalists ?? [];

          if (vocalists.length < 2) {
            log(`  ✗「${songName}」歌手不足 2 人，跳过`);
            continue;
          }

          // 构建 vocalist payload
          const vocalistPayload = vocalists.map((v) => ({
            id: v.id,
            is_support: validSupport.has(v.name),
          }));

          // 如果确实有需要标为和声的
          if (vocalistPayload.some((v) => v.is_support)) {
            await api.editSong({ id: song.id, vocalists: vocalistPayload });
            const supportList = vocalists
              .filter((v) => validSupport.has(v.name))
              .map((v) => v.name)
              .join("、");
            log(`  ✓「${songName}」和声: ${supportList}`);
            ok++;
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "失败";
          log(`  ✗「${songName}」和声标记失败: ${msg}`);
          fail++;
        }
      }

      log(`和声标记完成：${ok} 成功${fail > 0 ? `，${fail} 失败` : ""}`);
    },
    [log],
  );

  return { applyVocalSupport };
}
