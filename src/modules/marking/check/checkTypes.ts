// src/modules/marking/check/checkTypes.ts
export const FIELD_LABELS: Record<string, string> = {
  name: "歌名",
  vocal: "歌手",
  author: "作者",
  synthesizer: "引擎",
  copyright: "版权",
  type: "类别",
};

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
