// src/core/types/collab.ts
import type { Attribution } from "./stats";

export type MarkAction = "set" | "toggle_include" | "blacklist" | "unblacklist";

export interface MarkOp {
  opId: string;
  taskId: string;
  recordIndex: number;
  field: string;
  action: MarkAction;
  value: unknown;
  baseVersion: number;
  clientTime: string;
}

export interface Snapshot {
  taskId: string;
  version: number;
  records: Record<string, unknown>[];
  includeEntries: boolean[];
  blacklistedEntries: boolean[];
  recordAttributions: Attribution[];
  serverTime: string;
}

export type Row = Record<string, unknown>;
