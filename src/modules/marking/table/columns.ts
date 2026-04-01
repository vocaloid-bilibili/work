// src/modules/marking/table/columns.ts
import { COPYRIGHT, COPYRIGHT_MAP, SONG_TYPES } from "@/core/types/constants";

export interface ColDef {
  key: string;
  label: string;
  type: "text" | "tags" | "select";
  width: string;
  searchType?: string;
  options?: readonly {
    readonly value: number | string;
    readonly label: string;
  }[];
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
    options: COPYRIGHT,
  },
  {
    key: "type",
    label: "类别",
    type: "select",
    width: "min-w-[90px] w-[100px]",
    options: SONG_TYPES.map((t) => ({ value: t, label: t })),
  },
];

export { COPYRIGHT_MAP };

export const REQ_FIELDS = [
  "name",
  "vocal",
  "author",
  "synthesizer",
  "copyright",
  "type",
];
