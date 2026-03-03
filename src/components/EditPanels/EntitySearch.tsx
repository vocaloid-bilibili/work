// src/components/EditPanels/EntitySearch.tsx
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Hash, Search as SearchIcon, Loader2 } from "lucide-react";
import api from "@/utils/api";

interface EntitySearchProps {
  type: "song" | "vocalist" | "producer" | "synthesizer";
  placeholder?: string;
  value?: { id: number; name: string } | null;
  onChange: (item: { id: number; name: string } | null) => void;
  disabled?: boolean;
}

export default function EntitySearch({
  type,
  placeholder,
  value,
  onChange,
  disabled,
}: EntitySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 防抖搜索
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await api.search(type, query, 1, 8);
        setResults(result.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, type]);

  const isNumeric = /^\d+$/.test(query.trim());

  const handleSelect = async (item: { id: number; name: string }) => {
    onChange(item);
    setQuery("");
    setOpen(false);
  };

  const handleSelectById = async () => {
    const id = parseInt(query);
    if (!id) return;

    setLoading(true);
    try {
      let result;
      if (type === "song") {
        result = await api.selectSong(id);
      } else {
        result = await api.selectArtist(type, id);
      }
      const data = result.data || result;
      onChange({ id: data.id, name: data.name });
      setQuery("");
      setOpen(false);
    } catch {
      // 找不到，不处理
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
  };

  const typeLabels: Record<string, string> = {
    song: "歌曲",
    vocalist: "歌手",
    producer: "作者",
    synthesizer: "引擎",
  };

  return (
    <div ref={containerRef} className="relative">
      {value ? (
        <div
          className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50 cursor-pointer hover:bg-muted"
          onClick={disabled ? undefined : handleClear}
        >
          <span className="font-medium flex-1">{value.name}</span>
          <span className="text-xs text-muted-foreground">ID: {value.id}</span>
          {!disabled && (
            <span className="text-xs text-muted-foreground">点击清除</span>
          )}
        </div>
      ) : (
        <>
          <div className="relative">
            <Input
              placeholder={placeholder || `输入${typeLabels[type]}名称或ID搜索`}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => query && setOpen(true)}
              disabled={disabled}
              className="pr-8"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SearchIcon className="h-4 w-4" />
              )}
            </div>
          </div>

          {open && query && (
            <div className="absolute z-50 w-full mt-1 border rounded-md bg-popover shadow-lg max-h-64 overflow-y-auto">
              {/* ID 查询选项 */}
              {isNumeric && (
                <div
                  className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer border-b"
                  onClick={handleSelectById}
                >
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span>按 ID 查询: {query}</span>
                </div>
              )}

              {/* 搜索结果 */}
              {results.length > 0
                ? results.map((item) => (
                    <div
                      key={item.id}
                      className="px-3 py-2 hover:bg-muted cursor-pointer"
                      onClick={() => handleSelect(item)}
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        ID: {item.id}
                      </div>
                    </div>
                  ))
                : !isNumeric &&
                  !loading && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      无搜索结果
                    </div>
                  )}

              {loading && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  搜索中...
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
