// src/modules/editor/components/RelationsEditor.tsx
import {
  Loader2,
  Music2,
  Plus,
  Search,
  Trash2,
  X,
  Check,
  Mic,
} from "lucide-react";
import { cn } from "@/ui/cn";
import { Btn } from "./Btn";
import { Input } from "./Input";
import CachedImg from "@/shared/ui/CachedImg";
import type { useRelations, RelatedSong } from "../hooks/useRelations";
import type { Song } from "@/core/types/catalog";

type R = ReturnType<typeof useRelations>;

function Cover({ url, className }: { url: string | null; className?: string }) {
  if (url) {
    return (
      <CachedImg
        src={url}
        alt=""
        className={cn(
          "rounded-lg object-cover bg-neutral-100 dark:bg-neutral-800",
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        "rounded-lg bg-linear-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center",
        className,
      )}
    >
      <Music2 className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
    </div>
  );
}

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none shrink-0",
        color,
      )}
    >
      {children}
    </span>
  );
}

function typeBadgeColor(type?: string) {
  switch (type) {
    case "翻唱":
      return "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300";
    case "原创":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
    case "本家重置":
      return "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300";
    case "串烧":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
    default:
      return "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300";
  }
}

function songThumb(s: Song): string | null {
  return s.videos?.[0]?.thumbnail ?? null;
}

function relatedThumb(s: RelatedSong): string | null {
  return s.thumbnail ?? null;
}

function artistLine(
  producers?: { id: number; name: string }[],
  vocalists?: { id: number; name: string }[],
): string {
  const segs: string[] = [];
  if (producers?.length) segs.push(producers.map((a) => a.name).join("、"));
  if (vocalists?.length) segs.push(vocalists.map((a) => a.name).join("、"));
  return segs.join(" · ");
}

function RelationItem({
  song,
  onRemove,
}: {
  song: RelatedSong;
  onRemove: () => void;
}) {
  const display = song.display_name?.trim();
  const title = display || song.name;
  const subtitle = display && display !== song.name ? song.name : null;
  const vocs = (song as any).vocalists as
    | { id: number; name: string }[]
    | undefined;
  const artists = artistLine(song.producers, vocs);

  return (
    <div className="group flex items-center gap-2.5 sm:gap-3 rounded-2xl px-2.5 py-2.5 sm:px-3 sm:py-3 transition-colors hover:bg-accent/40">
      <Cover
        url={relatedThumb(song)}
        className="h-10 w-14 sm:h-12 sm:w-17 shrink-0"
      />

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[13px] font-semibold leading-tight truncate">
          {title}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground leading-none">
          <span className="font-mono">#{song.id}</span>
          {song.type && (
            <Badge color={typeBadgeColor(song.type)}>{song.type}</Badge>
          )}
          {subtitle && (
            <span className="truncate max-w-20 sm:max-w-32">{subtitle}</span>
          )}
        </div>
        {artists && (
          <p className="text-[11px] text-muted-foreground leading-tight truncate">
            {artists}
          </p>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="shrink-0 rounded-xl p-2 text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all"
        title="移除关联"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SearchResult({
  song,
  checked,
  multiSelect,
  disabled,
  onAction,
}: {
  song: Song;
  checked: boolean;
  multiSelect: boolean;
  disabled: boolean;
  onAction: () => void;
}) {
  const display = song.display_name?.trim();
  const title = display || song.name;
  const subtitle = display && display !== song.name ? song.name : null;
  const artists = artistLine(song.producers, song.vocalists);

  return (
    <button
      disabled={disabled}
      onClick={onAction}
      className={cn(
        "flex w-full items-center gap-2.5 sm:gap-3 rounded-xl p-2 sm:p-2.5 text-left transition-colors",
        checked ? "bg-primary/8" : "hover:bg-accent/50",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {multiSelect && (
        <div
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
            checked
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/30",
          )}
        >
          {checked && <Check className="h-2.5 w-2.5" strokeWidth={2.5} />}
        </div>
      )}

      <Cover
        url={songThumb(song)}
        className="h-10 w-14 sm:h-12 sm:w-17 shrink-0"
      />

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[13px] font-semibold leading-tight truncate">
          {title}
        </p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground leading-tight truncate">
            {subtitle}
          </p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground leading-none">
          <span className="font-mono">#{song.id}</span>
          {song.type && (
            <Badge color={typeBadgeColor(song.type)}>{song.type}</Badge>
          )}
          {artists && (
            <span className="truncate max-w-24 sm:max-w-none">{artists}</span>
          )}
        </div>
      </div>

      {!multiSelect && <Plus className="h-4 w-4 shrink-0 text-primary" />}
    </button>
  );
}

function SearchArea({ r }: { r: R }) {
  if (!r.mode) return null;

  const isOrig = r.mode === "original";
  const multiSelect = !isOrig;
  const covers = r.filtered.filter((s) => s.type === "翻唱");
  const allCoversChecked =
    covers.length > 0 && covers.every((s) => r.selected.has(s.id));

  return (
    <div className="rounded-2xl bg-accent/30 dark:bg-accent/20 p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold">
          {isOrig ? "添加本家" : "添加衍生"}
          {multiSelect && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              可多选
            </span>
          )}
        </h4>
        <button
          onClick={r.closeMode}
          className="rounded-full p-1 hover:bg-background/80 text-muted-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 h-10 bg-background rounded-xl"
          placeholder="输入歌曲名或 ID"
          value={r.query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            r.setQuery(e.target.value)
          }
          autoFocus
        />
        {r.searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {multiSelect && covers.length > 1 && (
        <button
          onClick={() => {
            for (const c of covers) {
              const has = r.selected.has(c.id);
              if (allCoversChecked ? has : !has) r.toggle(c);
            }
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline underline-offset-2"
        >
          <Check className="h-3 w-3" />
          {allCoversChecked ? "取消全选翻唱" : `全选 ${covers.length} 首翻唱`}
        </button>
      )}

      {r.filtered.length > 0 && (
        <div className="max-h-64 sm:max-h-80 overflow-y-auto space-y-1 overscroll-contain">
          {r.filtered.map((s) => (
            <SearchResult
              key={s.id}
              song={s}
              checked={r.selected.has(s.id)}
              multiSelect={multiSelect}
              disabled={r.busy}
              onAction={() =>
                isOrig ? r.addSingle(s, "original") : r.toggle(s)
              }
            />
          ))}
        </div>
      )}

      {r.query.trim().length > 0 && !r.searching && r.filtered.length === 0 && (
        <div className="flex flex-col items-center py-6 sm:py-8 text-muted-foreground">
          <Search className="h-6 w-6 mb-2 opacity-40" />
          <p className="text-sm">没有找到匹配的歌曲</p>
        </div>
      )}

      {multiSelect && r.selected.size > 0 && (
        <Btn
          variant="primary"
          className="w-full h-10"
          loading={r.busy}
          onClick={r.addBatch}
        >
          添加选中的 {r.selected.size} 首
        </Btn>
      )}
    </div>
  );
}

function SectionHead({
  label,
  count,
  actions,
}: {
  label: string;
  count?: number;
  actions: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground shrink-0">
        {label}
        {typeof count === "number" && count > 0 && (
          <span className="ml-1.5 text-foreground/50 normal-case tracking-normal font-semibold">
            {count}
          </span>
        )}
      </p>
      <div className="flex items-center gap-0.5 shrink-0">{actions}</div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="py-4 text-center text-xs text-muted-foreground">{text}</p>
  );
}

export function RelationsEditor({ r }: { r: R }) {
  if (r.loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">加载关联数据…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <SectionHead
          label="本家作品"
          count={r.originals.length}
          actions={
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
          }
        />

        {r.originals.length === 0 && r.mode !== "original" && (
          <EmptyHint text="暂无本家关联" />
        )}

        {r.originals.map((s) => (
          <RelationItem
            key={s.id}
            song={s}
            onRemove={() => r.remove("original", s.id)}
          />
        ))}
      </section>

      <section className="space-y-2">
        <SectionHead
          label="衍生作品"
          count={r.derivatives.length}
          actions={
            <div className="flex items-center gap-0.5">
              <Btn variant="ghost" size="sm" onClick={r.findCovers}>
                <Mic className="h-3 w-3" />{" "}
                <span className="hidden sm:inline">查找翻唱</span>
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
          }
        />

        {r.derivatives.length === 0 && r.mode !== "derivative" && (
          <EmptyHint text="暂无衍生作品" />
        )}

        {r.derivatives.map((s) => (
          <RelationItem
            key={s.id}
            song={s}
            onRemove={() => r.remove("derivative", s.id)}
          />
        ))}
      </section>

      <SearchArea r={r} />
    </div>
  );
}
