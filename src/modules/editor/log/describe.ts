// src/modules/editor/log/describe.ts
import { FIELD_LABELS } from "./constants";
import { BOARDS, ARTIST_TYPES, COPYRIGHT_MAP } from "@/core/types/constants";

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

export interface Description {
  /** 主句，如 "编辑了「千本桜」" */
  headline: string;
  /** 变更行，如 ["歌手: A → B", "类型: 翻唱 → 原创"] */
  lines: string[];
}

export function describe(
  action: string,
  detail: Record<string, unknown> | null,
): Description {
  if (!detail) return { headline: action, lines: [] };

  const lines: string[] = [];
  const songName = s(detail.songName || detail.title);
  const changes = detail.changes as
    | Record<string, { old: unknown; new: unknown }>
    | undefined;

  // 变更行
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
      const headline = from
        ? `将视频 ${bvid} 从「${from}」移动到「${to}」`
        : `将视频 ${bvid} 移动到「${to}」`;
      return { headline, lines };
    }

    case "set_board_video": {
      const board = detail.board ? bLabel(s(detail.board)) : "";
      const issue = s(detail.issue);
      const bvid = s(detail.newBvid);
      const old = s(detail.oldBvid);
      if (old && old !== bvid) lines.push(`原视频: ${old}`);
      return { headline: `设置${board}第 ${issue} 期视频 ${bvid}`, lines };
    }

    default:
      return { headline: songName || action, lines };
  }
}
