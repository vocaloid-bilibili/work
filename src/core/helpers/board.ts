// src/core/helpers/board.ts
import { DateTime } from "luxon";

export type Section = "daily" | "weekly" | "monthly" | "special";
export type BasicSection = "daily" | "weekly" | "monthly";

export function issueNow(): Record<BasicSection, number> {
  const now = DateTime.local();
  return {
    daily: Math.floor(now.diff(DateTime.local(2024, 7, 3), "days").days!) + 1,
    weekly:
      Math.floor(now.diff(DateTime.local(2024, 8, 31), "weeks").weeks!) + 1,
    monthly:
      Math.floor(now.diff(DateTime.local(2024, 7, 1), "months").months!) + 1,
  };
}
