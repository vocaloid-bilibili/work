// src/modules/stats/FeedItem.tsx
import Avatar from "@/shared/ui/Avatar";
import { cn } from "@/ui/cn";
import { getAction } from "./actions";
import {
  FIELD_LABELS,
  BOARDS,
  ARTIST_TYPES,
  COPYRIGHT_MAP,
} from "@/core/types/constants";
import type { LogEntry } from "@/core/types/stats";

interface P {
  op: LogEntry;
  onClickUser?: (userId: string) => void;
}

export default function FeedItem({ op, onClickUser }: P) {
  const a = getAction(op.action);
  const Icon = a.Icon;
  const d = op.value as Record<string, unknown> | null;

  const fieldLabel =
    op.action === "mark_field_edit" && d?.field
      ? FIELD_LABELS[d.field as string] || (d.field as string)
      : null;
  const fieldValue =
    op.action === "mark_field_edit" && d?.value != null
      ? String(d.value)
      : null;

  const markBvid =
    op.source === "mark" && op.action !== "mark_field_edit" && d?.bvid
      ? String(d.bvid)
      : null;

  const desc = op.source === "edit" ? describe(op.action, d) : null;

  return (
    <div
      className={cn(
        "group relative flex gap-3 py-3 px-3.5 rounded-xl border border-l-[3px] transition-colors hover:bg-muted/30",
        a.border,
      )}
    >
      <button
        className="shrink-0 mt-0.5"
        onClick={() => onClickUser?.(op.user.id)}
        title={`筛选 ${op.user.nickname || op.user.username || ""} 的操作`}
      >
        <Avatar
          src={op.user?.avatar}
          name={op.user?.nickname || op.user?.username || "?"}
          size="sm"
        />
      </button>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <button
            className="text-sm font-semibold truncate hover:underline"
            onClick={() => onClickUser?.(op.user.id)}
          >
            {op.user?.nickname || op.user?.username || "未知"}
          </button>

          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md shrink-0",
              a.bg,
              a.color,
            )}
          >
            <Icon className="h-3 w-3" />
            {a.label}
          </span>

          {fieldLabel && (
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0">
              {fieldLabel}
            </span>
          )}

          <span className="text-[11px] text-muted-foreground/50 tabular-nums ml-auto shrink-0">
            {op.at?.slice(11, 16)}
          </span>
        </div>

        {op.source === "mark" && op.recordTitle && (
          <p className="text-sm text-foreground/75 leading-snug line-clamp-1">
            {op.recordIndex >= 0 && (
              <span className="text-muted-foreground/40 font-mono text-[11px] mr-1">
                #{op.recordIndex + 1}
              </span>
            )}
            {op.recordTitle}
          </p>
        )}

        {markBvid && (
          <p className="text-[11px] text-muted-foreground/60 font-mono truncate">
            {markBvid}
          </p>
        )}

        {fieldValue && (
          <p className="text-xs text-foreground/60 truncate">
            <span className="text-muted-foreground/40 mr-1">→</span>
            {fieldValue}
          </p>
        )}

        {desc && (
          <p className="text-sm text-foreground/75 leading-snug line-clamp-2">
            {desc.headline}
          </p>
        )}

        {desc && desc.lines.length > 0 && (
          <div className="space-y-0.5">
            {desc.lines.map((line, i) => (
              <p key={i} className="text-xs text-foreground/60 truncate">
                <span className="text-muted-foreground/40 mr-1">·</span>
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const bLabel = (v: string) => BOARDS.find((b) => b.value === v)?.label ?? v;
const aLabel = (v: string) =>
  ARTIST_TYPES.find((a) => a.value === v)?.label ?? v;
const s = (v: unknown) => (v == null ? "" : String(v));

function fmtValue(field: string, v: unknown): string {
  if (v == null || v === "") return "（空）";
  if (field === "copyright") return COPYRIGHT_MAP[String(v)] ?? String(v);
  if (v === true) return "是";
  if (v === false) return "否";
  if (Array.isArray(v)) return v.join("、") || "（空）";
  return String(v);
}

interface Description {
  headline: string;
  lines: string[];
}

function describe(
  action: string,
  detail: Record<string, unknown> | null,
): Description {
  if (!detail) return { headline: action, lines: [] };

  const lines: string[] = [];
  const songName = s(detail.songName || detail.title);
  const songId = detail.songId;
  const bvid = s(detail.bvid);

  const changes = detail.changes as
    | Record<string, { old: unknown; new: unknown }>
    | undefined;

  const pushChanges = () => {
    if (!changes) return;
    for (const [field, diff] of Object.entries(changes)) {
      const label = FIELD_LABELS[field] ?? field;
      lines.push(
        `${label}: ${fmtValue(field, diff.old)} → ${fmtValue(field, diff.new)}`,
      );
    }
  };

  const songRef = (name: unknown, id: unknown): string | null => {
    const n = s(name);
    const i = id != null ? s(id) : "";
    if (n && i) return `「${n}」#${i}`;
    if (n) return `「${n}」`;
    if (i) return `#${i}`;
    return null;
  };

  switch (action) {
    case "add_song": {
      const cr = detail.collectedRow as Record<string, unknown> | undefined;
      const headline = songName ? `创建了歌曲「${songName}」` : "创建了歌曲";
      const ids: string[] = [];
      if (songId != null) ids.push(`#${s(songId)}`);
      if (bvid) ids.push(bvid);
      if (ids.length) lines.push(ids.join(" · "));
      const type = s(detail.type || cr?.type);
      const vocal = s(cr?.vocal);
      const producer = s(cr?.author);
      const synthesizer = s(cr?.synthesizer);
      if (type) lines.push(`类型: ${type}`);
      if (vocal) lines.push(`歌手: ${vocal}`);
      if (producer) lines.push(`作者: ${producer}`);
      if (synthesizer) lines.push(`引擎: ${synthesizer}`);
      return { headline, lines };
    }

    case "add_video": {
      const videoTitle = s(detail.videoTitle);
      const headline = videoTitle
        ? `将「${videoTitle}」添加到「${songName}」`
        : `将视频 ${bvid} 添加到「${songName}」`;
      const ids: string[] = [];
      if (songId != null) ids.push(`歌曲 #${s(songId)}`);
      if (bvid && videoTitle) ids.push(bvid);
      if (ids.length) lines.push(ids.join(" · "));
      return { headline, lines };
    }

    case "edit_song": {
      const headline = songName ? `编辑了「${songName}」` : "编辑了歌曲";
      const bvids = detail.bvids as string[] | undefined;
      const ids: string[] = [];
      if (songId != null) ids.push(`#${s(songId)}`);
      if (bvids?.length) ids.push(bvids.join(", "));
      if (ids.length) lines.push(ids.join(" · "));
      pushChanges();
      return { headline, lines };
    }

    case "edit_video": {
      const headline = `编辑了视频 ${bvid}`;
      const ref = songRef(detail.songName, songId);
      if (ref) lines.push(`歌曲: ${ref}`);
      pushChanges();
      return { headline, lines };
    }

    case "delete_song": {
      const headline = songName ? `移除了「${songName}」` : "移除了歌曲";
      const bvids = detail.bvids as string[] | undefined;
      const ids: string[] = [];
      if (songId != null) ids.push(`#${s(songId)}`);
      if (bvids?.length) ids.push(bvids.join(", "));
      if (ids.length) lines.push(ids.join(" · "));
      return { headline, lines };
    }

    case "delete_video": {
      const title = s(detail.title);
      const headline = title ? `移除了视频「${title}」` : `移除了视频 ${bvid}`;
      const ids: string[] = [];
      if (bvid && title) ids.push(bvid);
      const ref = songRef(detail.songName, songId);
      if (ref) ids.push(`歌曲: ${ref}`);
      if (ids.length) lines.push(ids.join(" · "));
      return { headline, lines };
    }

    case "restore_video": {
      const title = s(detail.title);
      const headline = title ? `恢复收录「${title}」` : `恢复收录视频 ${bvid}`;
      const ids: string[] = [];
      if (bvid && title) ids.push(bvid);
      const ref = songRef(detail.songName, songId);
      if (ref) ids.push(`歌曲: ${ref}`);
      if (ids.length) lines.push(ids.join(" · "));
      return { headline, lines };
    }

    case "reassign_video": {
      const from = detail.fromSong as { id?: number; name?: string } | null;
      const toSong = detail.toSong as
        | {
            id?: number;
            name?: string;
          }
        | undefined;
      const newName = s(detail.newSongName);
      const fromLabel = from?.name ? `「${from.name}」` : "?";
      const toLabel = toSong?.name
        ? `「${toSong.name}」`
        : newName
          ? `新歌曲「${newName}」`
          : "?";
      const headline = `将视频 ${bvid} 从${fromLabel}移动到${toLabel}`;
      const ids: string[] = [];
      if (from?.id != null) ids.push(`从 #${from.id}`);
      if (toSong?.id != null) ids.push(`到 #${toSong.id}`);
      if (ids.length) lines.push(ids.join(" → "));
      return { headline, lines };
    }

    case "merge_song": {
      const src = detail.source as { id?: number; name?: string } | undefined;
      const tgt = detail.target as { id?: number; name?: string } | undefined;
      const newName = s(detail.newSongName);
      const newId = detail.newSongId;
      const srcLabel = src?.name ? `「${src.name}」` : "?";
      const tgtLabel = tgt?.name
        ? `「${tgt.name}」`
        : newName
          ? `新歌曲「${newName}」`
          : "?";
      const headline = `将${srcLabel}合并到${tgtLabel}`;
      const ids: string[] = [];
      if (src?.id != null) ids.push(`#${src.id}`);
      ids.push("→");
      if (tgt?.id != null) ids.push(`#${tgt.id}`);
      else if (newId != null) ids.push(`#${s(newId)}`);
      else ids.push("新歌曲");
      lines.push(ids.join(" "));
      return { headline, lines };
    }

    case "merge_artist": {
      const src = detail.source as { id?: number; name?: string } | undefined;
      const tgt = detail.target as { id?: number; name?: string } | undefined;
      const newName = s(detail.newArtistName);
      const type = detail.artistType ? aLabel(s(detail.artistType)) : "";
      const srcLabel = src?.name ? `「${src.name}」` : "?";
      const tgtLabel = tgt?.name
        ? `「${tgt.name}」`
        : newName
          ? `新${type}「${newName}」`
          : "?";
      const headline = `合并${type}${srcLabel}→${tgtLabel}`;
      const ids: string[] = [];
      if (src?.id != null) ids.push(`#${src.id}`);
      ids.push("→");
      if (tgt?.id != null) ids.push(`#${tgt.id}`);
      else ids.push(`新${type}`);
      lines.push(ids.join(" "));
      if (detail.songsAffected != null)
        lines.push(`影响 ${s(detail.songsAffected)} 首歌曲`);
      return { headline, lines };
    }

    case "add_relation": {
      const direction = s(detail.direction);
      const dirLabel = direction === "original" ? "本家" : "衍生";
      const selfRef =
        songId != null ? `「${songName}」#${s(songId)}` : `「${songName}」`;

      const relations = detail.relations as
        | { id: number; name: string }[]
        | undefined;

      if (relations && relations.length > 0) {
        const names = relations.map((r) => `「${r.name}」#${r.id}`);
        if (names.length > 5) {
          lines.push(names.slice(0, 5).join("、") + " 等");
        } else {
          lines.push(names.join("、"));
        }
        return {
          headline: songName
            ? `为${selfRef}批量添加了 ${relations.length} 首${dirLabel}关联`
            : `批量添加了 ${relations.length} 首${dirLabel}关联`,
          lines,
        };
      }

      const relatedName = s(detail.relatedSongName);
      const relatedId = detail.relatedSongId || detail.related_song_id;
      const relatedLabel = songRef(relatedName, relatedId) || "?";
      return {
        headline: songName
          ? `为${selfRef}添加了${dirLabel}关联${relatedLabel}`
          : `添加了${dirLabel}关联${relatedLabel}`,
        lines,
      };
    }

    case "remove_relation": {
      const direction = s(detail.direction);
      const dirLabel = direction === "original" ? "本家" : "衍生";
      const selfRef =
        songId != null ? `「${songName}」#${s(songId)}` : `「${songName}」`;
      const relatedName = s(detail.relatedSongName);
      const relatedId = detail.relatedSongId || detail.related_song_id;
      const relatedLabel = songRef(relatedName, relatedId) || "?";

      return {
        headline: songName
          ? `移除了${selfRef}的${dirLabel}关联${relatedLabel}`
          : `移除了${dirLabel}关联${relatedLabel}`,
        lines,
      };
    }

    case "set_board_video": {
      const board = detail.board
        ? bLabel(s(detail.board))
        : s(detail.boardName);
      const issue = s(detail.issue);
      const vid = s(detail.newBvid || detail.bvid);
      const old = s(detail.oldBvid);
      if (old && old !== vid) lines.push(`原视频: ${old}`);
      return { headline: `设置${board}第 ${issue} 期视频 ${vid}`, lines };
    }

    default:
      return { headline: songName || action, lines };
  }
}
