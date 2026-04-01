// src/modules/marking/card/CardFields.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import TagEditor from "@/shared/ui/TagEditor";
import FieldName from "./FieldName";
import { cn } from "@/ui/cn";
import { COPYRIGHT, SONG_TYPES } from "@/core/types/constants";

const FIELDS = [
  { type: "string-hint", label: "歌名", prop: "name" },
  { type: "tags-hint", label: "歌手", prop: "vocal", search: "vocalist" },
  { type: "tags-hint", label: "作者", prop: "author", search: "producer" },
  {
    type: "tags-hint",
    label: "引擎",
    prop: "synthesizer",
    search: "synthesizer",
  },
  { type: "select", label: "视频类型", prop: "copyright", options: COPYRIGHT },
  {
    type: "select",
    label: "歌曲类型",
    prop: "type",
    options: SONG_TYPES.map((t) => ({ value: t, label: t })),
  },
];
const REQ = ["name", "vocal", "author", "synthesizer", "copyright", "type"];

interface P {
  record: any;
  include: boolean;
  blacklisted: boolean;
  onChange: (f: string, v: any) => void;
  onInputChange: (f: string, v: string) => void;
}

export default function CardFields({
  record,
  include,
  blacklisted,
  onChange,
  onInputChange,
}: P) {
  const err = (f: string) => {
    const v = record[f];
    const empty = v === undefined || v === null || String(v).trim() === "";
    return include && !blacklisted && REQ.includes(f) && empty;
  };

  return (
    <fieldset disabled={blacklisted} className="contents">
      <div
        className={cn(
          "grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-2.5 text-sm",
          blacklisted && "pointer-events-none",
        )}
      >
        {FIELDS.map((f) => (
          <div key={f.prop} className="flex flex-col space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
              {f.label}
            </span>
            {f.type === "string-hint" && (
              <FieldName
                value={record[f.prop]}
                onChange={(v) => onChange(f.prop, v)}
                hasError={err(f.prop)}
              />
            )}
            {f.type === "tags-hint" && (
              <TagEditor
                value={String(record[f.prop] ?? "")}
                onChange={(v) => onChange(f.prop, v)}
                onInputChange={(v) => onInputChange(f.prop, v)}
                searchType={f.search || f.prop}
                hasError={err(f.prop) || !!record[`_unconfirmed_${f.prop}`]}
              />
            )}
            {f.type === "select" && (
              <Select
                value={String(record[f.prop])}
                onValueChange={(v) => {
                  const n = Number(v);
                  onChange(f.prop, isNaN(n) ? v : n);
                }}
              >
                <SelectTrigger
                  className={cn(
                    "h-9",
                    err(f.prop) && "border-destructive focus:ring-destructive",
                  )}
                >
                  <SelectValue placeholder="选择..." />
                </SelectTrigger>
                <SelectContent>
                  {f.options?.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </div>
    </fieldset>
  );
}
