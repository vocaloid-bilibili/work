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
  const changes = detail.changes as
    | Record<string, { old: unknown; new: unknown }>
    | undefined;

  if (changes) {
    for (const [field, diff] of Object.entries(changes)) {
      const label = FIELD_LABELS[field] ?? field;
      lines.push(
        `${label}: ${fmtValue(field, diff.old)} → ${fmtValue(field, diff.new)}`,
      );
    }
  }

  switch (action) {
    case "edit_song":
      return {
        headline: songName ? `编辑了「${songName}」` : "编辑了歌曲",
        lines,
      };

    case "edit_video": {
      const bvid = s(detail.bvid);
      return { headline: `编辑了视频 ${bvid}`, lines };
    }

    case "delete_song":
      return {
        headline: songName ? `移除了「${songName}」` : "移除了歌曲",
        lines,
      };

    case "delete_video": {
      const bvid = s(detail.bvid);
      const title = s(detail.title);
      return {
        headline: title ? `移除了视频「${title}」` : `移除了视频 ${bvid}`,
        lines,
      };
    }

    case "merge_song": {
      const src = detail.source as { name?: string } | undefined;
      const tgt = detail.target as { name?: string } | undefined;
      const newName = s(detail.newSongName);
      const to = tgt?.name ?? (newName ? `新歌曲「${newName}」` : "?");
      return { headline: `将「${src?.name ?? "?"}」合并到「${to}」`, lines };
    }

    case "merge_artist": {
      const src = detail.source as { name?: string } | undefined;
      const tgt = detail.target as { name?: string } | undefined;
      const newName = s(detail.newArtistName);
      const to =
        tgt?.name ??
        (newName ? `新${aLabel(s(detail.artistType))}「${newName}」` : "?");
      const type = detail.artistType ? aLabel(s(detail.artistType)) : "";
      if (detail.songsAffected != null)
        lines.push(`影响 ${s(detail.songsAffected)} 首歌曲`);
      return {
        headline: `合并${type}「${src?.name ?? "?"}」→「${to}」`,
        lines,
      };
    }

    case "reassign_video": {
      const bvid = s(detail.bvid);
      const from = (detail.fromSong as { name?: string })?.name;
      const toSong = (detail.toSong as { name?: string })?.name;
      const newName = s(detail.newSongName);
      const to = toSong ?? (newName ? `新歌曲「${newName}」` : "?");
      return {
        headline: from
          ? `将视频 ${bvid} 从「${from}」移动到「${to}」`
          : `将视频 ${bvid} 移动到「${to}」`,
        lines,
      };
    }

    case "set_board_video": {
      const board = detail.board
        ? bLabel(s(detail.board))
        : s(detail.boardName);
      const issue = s(detail.issue);
      const bvid = s(detail.newBvid || detail.bvid);
      const old = s(detail.oldBvid);
      if (old && old !== bvid) lines.push(`原视频: ${old}`);
      return { headline: `设置${board}第 ${issue} 期视频 ${bvid}`, lines };
    }

    case "add_relation": {
      const direction = s(detail.direction);
      const dirLabel = direction === "original" ? "本家" : "衍生";

      const relations = detail.relations as
        | { id: number; name: string }[]
        | undefined;

      if (relations && relations.length > 0) {
        const names = relations.map((r) => `「${r.name}」`);
        if (names.length > 5) {
          lines.push(names.slice(0, 5).join("、") + ` 等`);
        } else {
          lines.push(names.join("、"));
        }
        return {
          headline: songName
            ? `为「${songName}」批量添加了 ${relations.length} 首${dirLabel}关联`
            : `批量添加了 ${relations.length} 首${dirLabel}关联`,
          lines,
        };
      }

      const added = detail.added as number[] | undefined;
      if (added && added.length > 0) {
        const skipped = detail.skipped as number[] | undefined;
        if (skipped?.length)
          lines.push(`跳过(重复): ${skipped.map((id) => `#${id}`).join(", ")}`);
        lines.push(`ID: ${added.map((id) => `#${id}`).join(", ")}`);
        return {
          headline: songName
            ? `为「${songName}」批量添加了 ${added.length} 首${dirLabel}关联`
            : `批量添加了 ${added.length} 首${dirLabel}关联`,
          lines,
        };
      }

      const relatedName = s(detail.relatedSongName);
      const relatedId = s(detail.relatedSongId || detail.related_song_id);
      const relatedLabel = relatedName || `#${relatedId}`;
      return {
        headline: songName
          ? `为「${songName}」添加了${dirLabel}关联「${relatedLabel}」`
          : `添加了${dirLabel}关联「${relatedLabel}」`,
        lines,
      };
    }

    case "remove_relation": {
      const direction = s(detail.direction);
      const relatedName = s(detail.relatedSongName);
      const relatedId = s(detail.relatedSongId || detail.related_song_id);
      const dirLabel = direction === "original" ? "本家" : "衍生";
      const relatedLabel = relatedName || `#${relatedId}`;
      return {
        headline: songName
          ? `移除了「${songName}」的${dirLabel}关联「${relatedLabel}」`
          : `移除了${dirLabel}关联「${relatedLabel}」`,
        lines,
      };
    }

    case "add_video": {
      const bvid = s(detail.bvid);
      const videoTitle = s(detail.videoTitle);
      const target = songName || `#${s(detail.songId)}`;
      return {
        headline: videoTitle
          ? `将「${videoTitle}」添加到「${target}」`
          : `将视频 ${bvid} 添加到「${target}」`,
        lines,
      };
    }

    case "add_song": {
      const type = s(detail.type);
      const vocal = s(detail.vocal);
      if (type) lines.push(`类型: ${type}`);
      if (vocal) lines.push(`歌手: ${vocal}`);
      if (detail.producer) lines.push(`作者: ${s(detail.producer)}`);
      return {
        headline: songName ? `创建了歌曲「${songName}」` : "创建了歌曲",
        lines,
      };
    }

    default:
      return { headline: songName || action, lines };
  }
}
