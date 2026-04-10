// src/modules/editor/components/RelationsEditor.tsx
import { Loader2, Mic, Plus, Search, Trash2, X, Check } from "lucide-react";
import { cn } from "@/ui/cn";
import { Btn } from "./Btn";
import { Input } from "./Input";
import type { useRelations, RelatedSong } from "../hooks/useRelations";
import CachedImg from "@/shared/ui/CachedImg";

type R = ReturnType<typeof useRelations>;

function Row({ song, onRemove }: { song: RelatedSong; onRemove: () => void }) {
  const name = song.display_name?.trim() || song.name;
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border/30 bg-background px-3 py-2 group">
      {song.thumbnail && (
        <CachedImg
          src={song.thumbnail}
          alt=""
          className="h-8 w-11 shrink-0 rounded object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-[10px] text-muted-foreground">
          #{song.id}
          {song.type ? ` · ${song.type}` : ""}
          {song.producers?.length
            ? ` · ${song.producers.map((p) => p.name).join(", ")}`
            : ""}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="shrink-0 rounded-md p-1 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SearchPanel({ r }: { r: R }) {
  if (!r.mode) return null;
  const isOrig = r.mode === "original";
  const covers = r.filtered.filter((s) => s.type === "翻唱");
  const allCoversSelected =
    covers.length > 0 && covers.every((s) => r.selected.has(s.id));

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/2 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">
          搜索{isOrig ? "本家" : "衍生"}关联
          {!isOrig && (
            <span className="font-normal text-muted-foreground ml-1">
              （支持多选）
            </span>
          )}
        </p>
        <button
          onClick={r.closeMode}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
        <Input
          className="pl-8"
          placeholder="歌曲名或 ID…"
          value={r.query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            r.setQuery(e.target.value)
          }
          autoFocus
        />
        {r.searching && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground/40" />
        )}
      </div>

      {!isOrig && covers.length > 0 && (
        <button
          onClick={() => {
            for (const s of covers) r.toggle(s);
          }}
          className="text-[11px] font-medium text-primary hover:underline"
        >
          {allCoversSelected ? "取消全选翻唱" : `全选 ${covers.length} 首翻唱`}
        </button>
      )}

      {r.filtered.length > 0 && (
        <div className="max-h-64 overflow-y-auto space-y-1 -mx-1 px-1">
          {r.filtered.map((s) => {
            const sel = r.selected.has(s.id);
            const name = s.display_name?.trim() || s.name;
            return (
              <button
                key={s.id}
                disabled={r.busy}
                onClick={() =>
                  isOrig ? r.addSingle(s, "original") : r.toggle(s)
                }
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg p-2 text-sm text-left transition-all",
                  sel
                    ? "bg-primary/10 border border-primary/25"
                    : "hover:bg-accent border border-transparent",
                )}
              >
                {!isOrig && (
                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                      sel
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/25",
                    )}
                  >
                    {sel && <Check className="h-2.5 w-2.5" />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="font-medium truncate block">{name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    #{s.id} · {s.type}
                  </span>
                </div>
                {isOrig && (
                  <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {r.query.trim() && !r.searching && r.filtered.length === 0 && (
        <p className="text-xs text-muted-foreground/60 text-center py-3">
          未找到结果
        </p>
      )}

      {!isOrig && r.selected.size > 0 && (
        <Btn
          variant="primary"
          className="w-full"
          loading={r.busy}
          onClick={r.addBatch}
        >
          批量添加 {r.selected.size} 首衍生作品
        </Btn>
      )}
    </div>
  );
}

export function RelationsEditor({ r }: { r: R }) {
  if (r.loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground/50">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> 加载关联…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground/70">
            本家作品
          </span>
          <Btn
            variant="ghost"
            size="sm"
            onClick={() =>
              r.mode === "original"
                ? r.closeMode()
                : (r.closeMode(), r.setMode("original"))
            }
          >
            {r.mode === "original" ? (
              <>
                <X className="h-3 w-3" /> 取消
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" /> 添加
              </>
            )}
          </Btn>
        </div>
        {r.originals.length === 0 && r.mode !== "original" && (
          <p className="text-[11px] text-muted-foreground/40 py-1">
            无本家关联
          </p>
        )}
        <div className="space-y-1.5">
          {r.originals.map((s) => (
            <Row
              key={s.id}
              song={s}
              onRemove={() => r.remove("original", s.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground/70">
            衍生作品
          </span>
          <div className="flex items-center gap-1">
            <Btn variant="ghost" size="sm" onClick={r.findCovers}>
              <Mic className="h-3 w-3" /> 查找翻唱
            </Btn>
            <Btn
              variant="ghost"
              size="sm"
              onClick={() =>
                r.mode === "derivative"
                  ? r.closeMode()
                  : (r.closeMode(), r.setMode("derivative"))
              }
            >
              {r.mode === "derivative" ? (
                <>
                  <X className="h-3 w-3" /> 取消
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" /> 添加
                </>
              )}
            </Btn>
          </div>
        </div>
        {r.derivatives.length === 0 && r.mode !== "derivative" && (
          <p className="text-[11px] text-muted-foreground/40 py-1">
            无衍生作品
          </p>
        )}
        <div className="space-y-1.5">
          {r.derivatives.map((s) => (
            <Row
              key={s.id}
              song={s}
              onRemove={() => r.remove("derivative", s.id)}
            />
          ))}
        </div>
      </div>

      <SearchPanel r={r} />
    </div>
  );
}
