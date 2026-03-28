// src/modules/marking/table/columns.ts
export interface ColDef {
  key: string;
  label: string;
  type: "text" | "tags" | "select";
  width: string;
  searchType?: string;
  options?: { value: number | string; label: string }[];
}

export const COLUMNS: ColDef[] = [
  {
    key: "name",
    label: "歌名",
    type: "text",
    width: "min-w-[180px] max-w-[260px]",
    searchType: "song",
  },
  {
    key: "vocal",
    label: "歌手",
    type: "tags",
    width: "min-w-[150px] max-w-[220px]",
    searchType: "vocalist",
  },
  {
    key: "author",
    label: "作者",
    type: "tags",
    width: "min-w-[150px] max-w-[220px]",
    searchType: "producer",
  },
  {
    key: "synthesizer",
    label: "引擎",
    type: "tags",
    width: "min-w-[150px] max-w-[220px]",
    searchType: "synthesizer",
  },
  {
    key: "copyright",
    label: "版权",
    type: "select",
    width: "min-w-[100px] w-[110px]",
    options: [
      { value: 1, label: "自制" },
      { value: 2, label: "转载" },
      { value: 3, label: "未定" },
      { value: 101, label: "转载投自制" },
      { value: 100, label: "自制投转载" },
    ],
  },
  {
    key: "type",
    label: "类别",
    type: "select",
    width: "min-w-[90px] w-[100px]",
    options: [
      { value: "翻唱", label: "翻唱" },
      { value: "原创", label: "原创" },
      { value: "串烧", label: "串烧" },
      { value: "本家重置", label: "本家重置" },
    ],
  },
];

export const COPYRIGHT_LABELS: Record<number, string> = {
  1: "自制",
  2: "转载",
  3: "未定",
  101: "转载投自制",
  100: "自制投转载",
};
export const REQ_FIELDS = [
  "name",
  "vocal",
  "author",
  "synthesizer",
  "copyright",
  "type",
];
