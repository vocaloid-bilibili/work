// src/modules/editor/log/ChangesDetail.tsx
import { FIELD_LABELS } from "./constants";
import { BOARDS, ARTIST_TYPES } from "@/core/types/constants";

const bLabel = (v: string) => BOARDS.find((b) => b.value === v)?.label ?? v;
const aLabel = (v: string) =>
  ARTIST_TYPES.find((a) => a.value === v)?.label ?? v;

function label(key: string) {
  return FIELD_LABELS[key] ?? key;
}
function fmt(v: unknown): string {
  if (v == null) return "（空）";
  if (v === true) return "是";
  if (v === false) return "否";
  if (Array.isArray(v)) return v.join("、") || "（空）";
  return String(v) || "（空）";
}

export default function ChangesDetail({
  detail,
}: {
  detail: Record<string, unknown> | null;
}) {
  if (!detail) return null;

  const changes = detail.changes as
    | Record<string, { old: unknown; new: unknown }>
    | undefined;
  const songName = detail.songName != null ? String(detail.songName) : null;
  const title = detail.title != null ? String(detail.title) : null;
  const source = detail.source as { id?: unknown; name?: unknown } | undefined;
  const target = detail.target as { id?: unknown; name?: unknown } | undefined;
  const fromSong = detail.fromSong as
    | { id?: unknown; name?: unknown }
    | undefined;
  const toSong = detail.toSong as { id?: unknown; name?: unknown } | undefined;

  return (
    <div className="mt-2 space-y-1.5 text-xs">
      {songName && (
        <div className="text-muted-foreground">
          歌曲：<span className="font-medium text-foreground">{songName}</span>
        </div>
      )}
      {title && !songName && (
        <div className="text-muted-foreground">
          标题：<span className="font-medium text-foreground">{title}</span>
        </div>
      )}

      {source && (
        <div className="flex items-center gap-1 flex-wrap text-muted-foreground">
          <span className="text-red-500">
            {String(source.name ?? source.id ?? "")}
          </span>
          <span>→</span>
          <span className="text-green-600">
            {target
              ? String(target.name ?? target.id ?? "")
              : String(detail.newSongName ?? detail.newArtistName ?? "")}
          </span>
          {detail.songsAffected != null && (
            <span className="ml-1">
              （影响 {String(detail.songsAffected)} 首）
            </span>
          )}
        </div>
      )}

      {detail.artistType != null && (
        <div className="text-muted-foreground">
          类型：{aLabel(String(detail.artistType))}
        </div>
      )}

      {fromSong && (
        <div className="text-muted-foreground">
          原歌曲：
          {fromSong.name
            ? `${fromSong.name} (ID: ${fromSong.id})`
            : `ID: ${fromSong.id}`}
          {toSong && (
            <span>
              {" "}
              → {String(toSong.name)} (ID: {String(toSong.id)})
            </span>
          )}
          {detail.newSongName != null && (
            <span> → 新歌曲「{String(detail.newSongName)}」</span>
          )}
        </div>
      )}

      {detail.board != null && detail.issue != null && (
        <div className="text-muted-foreground">
          {bLabel(String(detail.board))} 第 {String(detail.issue)} 期
          {detail.oldBvid != null && (
            <span>
              ：<span className="font-mono">{String(detail.oldBvid)}</span>
            </span>
          )}
          {detail.newBvid != null && (
            <span>
              {" "}
              → <span className="font-mono">{String(detail.newBvid)}</span>
            </span>
          )}
        </div>
      )}

      {Array.isArray(detail.bvids) && (detail.bvids as string[]).length > 0 && (
        <div className="text-muted-foreground">
          关联视频：
          <span className="font-mono">
            {(detail.bvids as string[]).join(", ")}
          </span>
        </div>
      )}

      {detail.bvid != null && !detail.bvids && !fromSong && !changes && (
        <div className="text-muted-foreground">
          BV号：<span className="font-mono">{String(detail.bvid)}</span>
        </div>
      )}

      {changes && Object.keys(changes).length > 0 && (
        <div className="space-y-1 border-t pt-1.5 mt-1.5">
          {Object.entries(changes).map(([field, diff]) => (
            <div
              key={field}
              className="flex items-start gap-1.5 text-muted-foreground"
            >
              <span className="shrink-0 min-w-[3em]">{label(field)}:</span>
              <span className="line-through text-red-400 break-all">
                {fmt(diff.old)}
              </span>
              <span className="shrink-0">→</span>
              <span className="text-green-600 break-all">{fmt(diff.new)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
