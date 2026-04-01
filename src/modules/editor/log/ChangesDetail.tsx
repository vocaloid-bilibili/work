// src/modules/editor/log/ChangesDetail.tsx

import { FIELD_LABELS } from "./constants";

const BOARD_LABELS: Record<string, string> = {
  "vocaloid-daily": "日刊",
  "vocaloid-weekly": "周刊",
  "vocaloid-monthly": "月刊",
};

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "（空）";
  if (v === true) return "是";
  if (v === false) return "否";
  if (Array.isArray(v)) return v.join("、") || "（空）";
  const s = String(v);
  return s || "（空）";
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
      {/* 歌曲名（edit_song / delete_song） */}
      {songName && (
        <div className="text-muted-foreground">
          歌曲：<span className="font-medium text-foreground">{songName}</span>
        </div>
      )}

      {/* 视频标题（edit_video / delete_video） */}
      {title && !songName && (
        <div className="text-muted-foreground">
          标题：<span className="font-medium text-foreground">{title}</span>
        </div>
      )}

      {/* 合并信息（merge_song / merge_artist） */}
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

      {/* 艺人类型 */}
      {detail.artistType != null && (
        <div className="text-muted-foreground">
          {"类型："}
          {detail.artistType === "vocalist"
            ? "歌手"
            : detail.artistType === "producer"
              ? "作者"
              : "引擎"}
        </div>
      )}

      {/* 视频移动（reassign_video） */}
      {fromSong && (
        <div className="text-muted-foreground">
          {"原歌曲："}
          {fromSong.name
            ? `${fromSong.name} (ID: ${fromSong.id})`
            : `ID: ${fromSong.id}`}
          {toSong && (
            <span>
              {" → "}
              {String(toSong.name)} (ID: {String(toSong.id)})
            </span>
          )}
          {detail.newSongName != null && (
            <span>
              {" → "}新歌曲「{String(detail.newSongName)}」
            </span>
          )}
        </div>
      )}

      {/* 榜单视频 */}
      {detail.board != null && detail.issue != null && (
        <div className="text-muted-foreground">
          {BOARD_LABELS[String(detail.board)] ?? String(detail.board)}
          {" 第 "}
          {String(detail.issue)}
          {" 期"}
          {detail.oldBvid != null && (
            <span>
              {"："}
              <span className="font-mono">{String(detail.oldBvid)}</span>
            </span>
          )}
          {detail.newBvid != null && (
            <span>
              {" → "}
              <span className="font-mono">{String(detail.newBvid)}</span>
            </span>
          )}
        </div>
      )}

      {/* 关联 bvids（delete_song / edit_song） */}
      {Array.isArray(detail.bvids) && (detail.bvids as string[]).length > 0 && (
        <div className="text-muted-foreground">
          {"关联视频："}
          <span className="font-mono">
            {(detail.bvids as string[]).join(", ")}
          </span>
        </div>
      )}

      {/* 单个 bvid（delete_video / edit_video 没有 changes 时） */}
      {detail.bvid != null && !detail.bvids && !fromSong && !changes && (
        <div className="text-muted-foreground">
          {"BV号："}
          <span className="font-mono">{String(detail.bvid)}</span>
        </div>
      )}

      {/* 字段变更 */}
      {changes && Object.keys(changes).length > 0 && (
        <div className="space-y-1 border-t pt-1.5 mt-1.5">
          {Object.entries(changes).map(([field, diff]) => (
            <div
              key={field}
              className="flex items-start gap-1.5 text-muted-foreground"
            >
              <span className="shrink-0 min-w-[3em]">{fieldLabel(field)}:</span>
              <span className="line-through text-red-400 break-all">
                {formatValue(diff.old)}
              </span>
              <span className="shrink-0">→</span>
              <span className="text-green-600 break-all">
                {formatValue(diff.new)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
