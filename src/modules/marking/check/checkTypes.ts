// src/modules/marking/check/checkTypes.ts
export { FIELD_LABELS } from "@/core/types/constants";

export interface CheckResult {
  pending: { index: number; title: string }[];
  missingFields: { index: number; title: string; missingLabels: string[] }[];
  nameMatchTitle: { index: number; title: string }[];
  authorMatchUp: { index: number; title: string; detail: string }[];
  sameAuthorDiffName: {
    author: string;
    songs: { index: number; name: string; title: string }[];
  }[];
  inconsistentEntries: {
    key: string;
    author: string;
    name: string;
    inconsistentFields: string[];
    entries: { index: number; title: string; values: Record<string, string> }[];
  }[];
}
