// src/modules/ingest/types.ts

import type { BoardId, DataId } from "@/core/helpers/filename";
import { parseFilename, isBoardId } from "@/core/helpers/filename";
import { BOARDS, PARTS } from "@/core/types/constants";

/* ─── types ─── */

export type StepStatus = "idle" | "loading" | "success" | "failed";
export type Phase = "idle" | "configure" | "uploading" | "process";

export type ParseResult =
  | { type: "board"; id: BoardId }
  | { type: "data"; id: DataId }
  | { type: "unknown" };

/* ─── helpers ─── */

export const bLabel = (v: string) =>
  BOARDS.find((b) => b.value === v)?.label ?? v;

export const pLabel = (v: string) =>
  PARTS.find((p) => p.value === v)?.label ?? v;

export function formatIssue(b: BoardId): string {
  return b.board === "vocaloid-annual" ? `${b.issue} 年` : `第 ${b.issue} 期`;
}

export function tryParse(name: string): ParseResult {
  try {
    const id = parseFilename(name);
    if (isBoardId(id)) return { type: "board", id };
    if (id.date && id.date.isValid) return { type: "data", id };
    return { type: "unknown" };
  } catch {
    return { type: "unknown" };
  }
}
