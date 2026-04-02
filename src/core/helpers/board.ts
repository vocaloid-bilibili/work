// src/core/helpers/board.ts
import { DateTime } from "luxon";

export type Section = "daily" | "weekly" | "monthly" | "special";
export type BasicSection = "daily" | "weekly" | "monthly";

export function issueNow(): Record<BasicSection, number> {
  const now = DateTime.local();
  const daily = now.diff(DateTime.local(2024, 7, 3), "days").days;
  const weekly = now.diff(DateTime.local(2024, 8, 31), "weeks").weeks;
  const monthly = now.diff(DateTime.local(2024, 7, 1), "months").months;
  return {
    daily: Math.max(1, Math.floor(isNaN(daily) ? 0 : daily) + 1),
    weekly: Math.max(1, Math.floor(isNaN(weekly) ? 0 : weekly) + 1),
    monthly: Math.max(1, Math.floor(isNaN(monthly) ? 0 : monthly) + 1),
  };
}
