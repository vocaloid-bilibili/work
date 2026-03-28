// src/shared/ui/EntityPicker.tsx
import { useState, useEffect, useRef } from "react";
import { Input } from "@/ui/input";
import { Hash, Search, Loader2 } from "lucide-react";
import * as api from "@/core/api/mainEndpoints";
import { useClickOutside } from "../hooks/useClickOutside";

export type EntityKind = "song" | "vocalist" | "producer" | "synthesizer";
const LABELS: Record<EntityKind, string> = {
  song: "歌曲",
  vocalist: "歌手",
  producer: "作者",
  synthesizer: "引擎",
};

interface P {
  kind: EntityKind;
  value?: { id: number; name: string } | null;
  onChange: (v: { id: number; name: string } | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function EntityPicker({
  kind,
  value,
  onChange,
  placeholder,
  disabled,
}: P) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<{ id: number; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrap = useRef<HTMLDivElement>(null);
  useClickOutside(wrap, () => setShow(false));

  useEffect(() => {
    if (!q.trim()) {
      setHits([]);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await api.search(kind, q, 1, 8);
        setHits(r.data || []);
      } catch {
        setHits([]);
      } finally {
        setBusy(false);
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [q, kind]);

  const pick = (item: { id: number; name: string }) => {
    onChange(item);
    setQ("");
    setShow(false);
  };
  const pickById = async () => {
    const id = parseInt(q);
    if (!id) return;
    setBusy(true);
    try {
      const r =
        kind === "song"
          ? await api.selectSong(id)
          : await api.selectArtist(kind, id);
      const d = (r as any).data || r;
      pick({ id: d.id, name: d.name });
    } catch {
      /**/
    } finally {
      setBusy(false);
    }
  };

  if (value)
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50 cursor-pointer hover:bg-muted"
        onClick={
          disabled
            ? undefined
            : () => {
                onChange(null);
                setQ("");
              }
        }
      >
        <span className="font-medium flex-1">{value.name}</span>
        <span className="text-xs text-muted-foreground">ID: {value.id}</span>
        {!disabled && (
          <span className="text-xs text-muted-foreground">点击清除</span>
        )}
      </div>
    );

  return (
    <div ref={wrap} className="relative">
      <div className="relative">
        <Input
          placeholder={placeholder || `输入${LABELS[kind]}名称或ID搜索`}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setShow(true);
          }}
          onFocus={() => q && setShow(true)}
          disabled={disabled}
          className="pr-8"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
      </div>
      {show && q && (
        <div className="absolute z-50 w-full mt-1 border rounded-md bg-popover shadow-lg max-h-64 overflow-y-auto">
          {/^\d+$/.test(q.trim()) && (
            <div
              className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer border-b"
              onClick={pickById}
            >
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span>按 ID 查询: {q}</span>
            </div>
          )}
          {hits.map((h) => (
            <div
              key={h.id}
              className="px-3 py-2 hover:bg-muted cursor-pointer"
              onClick={() => pick(h)}
            >
              <div className="font-medium">{h.name}</div>
              <div className="text-xs text-muted-foreground">ID: {h.id}</div>
            </div>
          ))}
          {hits.length === 0 && !/^\d+$/.test(q.trim()) && !busy && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              无结果
            </div>
          )}
        </div>
      )}
    </div>
  );
}
