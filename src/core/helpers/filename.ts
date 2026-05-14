// src/core/helpers/filename.ts
import { DateTime } from "luxon";

type SeqBoard =
  | "vocaloid-monthly"
  | "vocaloid-weekly"
  | "vocaloid-daily"
  | "vocaloid-annual"
  | "cover-weekly";

export interface BoardId {
  board: SeqBoard;
  part: "main" | "new";
  issue: number;
}
export interface DataId {
  date: DateTime;
}
export const isBoardId = (x: BoardId | DataId): x is BoardId => "board" in x;

export function parseFilename(name: string): BoardId | DataId {
  name = name.replace(/\.xlsx$/, "");

  if (name.startsWith("翻唱")) {
    const ds = name.slice(2);
    const d = DateTime.fromFormat(ds, "yyyy-MM-dd");
    return {
      board: "cover-weekly",
      part: "main",
      issue:
        Math.floor(
          d.diff(DateTime.fromObject({ year: 2026, month: 4, day: 1 }), "days")
            .days / 7,
        ) + 1,
    };
  }

  const hc = name.split("-").length - 1;
  if (hc === 1) {
    const part = name.startsWith("新曲") ? ("new" as const) : ("main" as const);
    const ds = part === "new" ? name.slice(2) : name;
    const d = DateTime.fromFormat(ds, "yyyy-MM");
    return {
      board: "vocaloid-monthly",
      part,
      issue: (d.year - 2024) * 12 + d.month - 6,
    };
  }
  if (hc > 1) {
    const part = name.startsWith("新曲") ? ("new" as const) : ("main" as const);
    const ds = part === "new" ? name.slice(2) : name;
    const d = DateTime.fromFormat(ds, "yyyy-MM-dd");
    return {
      board: "vocaloid-weekly",
      part,
      issue: d.diff(
        DateTime.fromObject({ year: 2024, month: 8, day: 31 }),
        "weeks",
      ).weeks,
    };
  }
  if (name.includes("与")) {
    const part = name.startsWith("新曲榜")
      ? ("new" as const)
      : ("main" as const);
    const ds =
      part === "new" ? name.slice(3).split("与")[0]! : name.split("与")[0]!;
    const d = DateTime.fromFormat(ds, "yyyyMMdd");
    return {
      board: "vocaloid-daily",
      part,
      issue: d.diff(
        DateTime.fromObject({ year: 2024, month: 7, day: 3 }),
        "days",
      ).days,
    };
  }
  // 年刊：4 位数字年份，如 2025
  if (/^\d{4}$/.test(name)) {
    return {
      board: "vocaloid-annual",
      part: "main",
      issue: parseInt(name, 10),
    };
  }
  return { date: DateTime.fromFormat(name, "yyyyMMdd") };
}
