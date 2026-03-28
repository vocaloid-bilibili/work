// src/core/helpers/filename.ts
import { DateTime } from "luxon";

type SeqBoard = "vocaloid-monthly" | "vocaloid-weekly" | "vocaloid-daily";
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
  return { date: DateTime.fromFormat(name, "yyyyMMdd") };
}
