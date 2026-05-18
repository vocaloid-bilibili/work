// src/modules/marking/card/CardFields.tsx
import { useCallback, useMemo } from "react";
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
import type { Row } from "@/core/types/collab";

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

function parseSupportSet(raw: unknown): Set<string> {
  if (!raw) return new Set();
  try {
    const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function splitVocal(s: string): string[] {
  return s
    .split("、")
    .map((t) => t.trim())
    .filter(Boolean);
}

interface P {
  record: Row;
  include: boolean;
  blacklisted: boolean;
  onChange: (f: string, v: unknown) => void;
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

  const vocalNames = useMemo(
    () => splitVocal(String(record.vocal ?? "")),
    [record.vocal],
  );
  const supportSet = useMemo(
    () => parseSupportSet(record._vocal_support),
    [record._vocal_support],
  );

  const toggleSupport = useCallback(
    (name: string) => {
      const next = new Set(supportSet);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      const cleaned = [...next].filter((n) => vocalNames.includes(n));
      onChange("_vocal_support", JSON.stringify(cleaned));
    },
    [supportSet, vocalNames, onChange],
  );

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
                value={record[f.prop] as string}
                onChange={(v) => onChange(f.prop, v)}
                hasError={err(f.prop)}
              />
            )}
            {f.type === "tags-hint" && (
              <>
                <TagEditor
                  value={String(record[f.prop] ?? "")}
                  onChange={(v) => onChange(f.prop, v)}
                  onInputChange={(v) => onInputChange(f.prop, v)}
                  searchType={f.search || f.prop}
                  hasError={err(f.prop) || !!record[`_unconfirmed_${f.prop}`]}
                />
                {f.prop === "vocal" && vocalNames.length >= 2 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {vocalNames.map((name) => {
                      const isSupport = supportSet.has(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => toggleSupport(name)}
                          disabled={blacklisted}
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[11px] transition-colors border cursor-pointer select-none",
                            isSupport
                              ? "border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300"
                              : "border-transparent text-muted-foreground hover:text-foreground/70",
                          )}
                        >
                          {name}
                          {isSupport && (
                            <span className="ml-0.5 text-[10px]">和声</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
            {f.type === "select" && (
              <Select
                value={String(record[f.prop])}
                onValueChange={(v: string) => {
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
