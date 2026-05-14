// src/core/helpers/filename.ts

import { DateTime } from "luxon";

export interface BoardId {
  board: string;
  part: "main" | "new";
  issue: number;
}

export interface DataId {
  date: DateTime;
}

export function isBoardId(id: BoardId | DataId): id is BoardId {
  return "board" in id;
}

/**
 * 日刊:       20260514与20260513 / 新曲榜20260514与20260513
 * 周刊:       2026-05-09         / 新曲2026-05-09
 * 月刊:       2026-04            / 新曲2026-04
 * 年刊:       2025
 * 翻唱周刊:   翻唱2026-05-06
 * 数据快照:   20260514
 */

export function parseFilename(raw: string): BoardId | DataId | null {
  const name = raw.replace(/\.[^.]+$/, "");
  let m: RegExpMatchArray | null;

  // 日刊
  if ((m = name.match(/^(新曲榜)?(\d{8})与\d{8}$/))) {
    const part = m[1] ? "new" : "main";
    const endDate = DateTime.fromFormat(m[2], "yyyyMMdd");
    const base = DateTime.fromISO("2024-07-03");
    const issue = Math.round(endDate.diff(base, "days").days);
    return { board: "vocaloid-daily", part, issue };
  }

  // 翻唱周刊
  if ((m = name.match(/^翻唱(\d{4}-\d{2}-\d{2})$/))) {
    const d = DateTime.fromISO(m[1]);
    const base = DateTime.fromISO("2026-04-01");
    const issue = Math.round(d.diff(base, "days").days / 7) + 1;
    return { board: "cover-weekly", part: "main", issue };
  }

  // 周刊新曲
  if ((m = name.match(/^新曲(\d{4}-\d{2}-\d{2})$/))) {
    const d = DateTime.fromISO(m[1]);
    const base = DateTime.fromISO("2024-08-31");
    const issue = Math.round(d.diff(base, "days").days / 7);
    return { board: "vocaloid-weekly", part: "new", issue };
  }

  // 月刊新曲
  if ((m = name.match(/^新曲(\d{4}-\d{2})$/))) {
    const d = DateTime.fromFormat(m[1], "yyyy-MM");
    const issue = (d.year - 2024) * 12 + d.month - 6;
    return { board: "vocaloid-monthly", part: "new", issue };
  }

  // 周刊
  if ((m = name.match(/^(\d{4}-\d{2}-\d{2})$/))) {
    const d = DateTime.fromISO(m[1]);
    const base = DateTime.fromISO("2024-08-31");
    const issue = Math.round(d.diff(base, "days").days / 7);
    return { board: "vocaloid-weekly", part: "main", issue };
  }

  // 月刊
  if ((m = name.match(/^(\d{4}-\d{2})$/))) {
    const d = DateTime.fromFormat(m[1], "yyyy-MM");
    const issue = (d.year - 2024) * 12 + d.month - 6;
    return { board: "vocaloid-monthly", part: "main", issue };
  }

  // 年刊
  if ((m = name.match(/^(\d{4})$/))) {
    return {
      board: "vocaloid-annual",
      part: "main",
      issue: parseInt(m[1], 10),
    };
  }

  // 数据快照
  if ((m = name.match(/^(\d{8})$/))) {
    return { date: DateTime.fromFormat(m[1], "yyyyMMdd") };
  }

  // 都不匹配 → null
  return null;
}
