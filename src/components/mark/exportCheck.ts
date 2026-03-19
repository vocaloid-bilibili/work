const isFilled = (v: unknown): boolean =>
  v !== undefined && v !== null && String(v).trim() !== "";

const FIELD_LABELS: Record<string, string> = {
  name: "歌名",
  vocal: "歌手",
  author: "作者",
  synthesizer: "引擎",
  copyright: "版权",
  type: "类别",
};

const REQ_FIELDS = [
  "name",
  "vocal",
  "author",
  "synthesizer",
  "copyright",
  "type",
];

export interface PendingItem {
  index: number;
  title: string;
}
export interface MissingFieldItem {
  index: number;
  title: string;
  missing: string[];
  missingLabels: string[];
}
export interface MatchItem {
  index: number;
  title: string;
  detail: string;
}

export interface ExportCheckResult {
  pending: PendingItem[];
  missingFields: MissingFieldItem[];
  nameMatchTitle: MatchItem[];
  authorMatchUp: MatchItem[];
}

export function runExportChecks(
  records: any[],
  includeEntries: boolean[],
  blacklistedEntries: boolean[],
): ExportCheckResult {
  const pending: PendingItem[] = [];
  const missingFields: MissingFieldItem[] = [];
  const nameMatchTitle: MatchItem[] = [];
  const authorMatchUp: MatchItem[] = [];

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const included = includeEntries[i];
    const blacklisted = blacklistedEntries[i] || false;

    // ── 检查 1: 待处理（既没收录也没排除）──
    if (!included && !blacklisted) {
      pending.push({ index: i, title: r.title || `#${i + 1}` });
    }

    // 以下只检查已收录且未排除的
    if (!included || blacklisted) continue;

    // ── 检查 2: 必填字段缺失 ──
    const missing = REQ_FIELDS.filter((f) => !isFilled(r[f]));
    if (missing.length > 0) {
      missingFields.push({
        index: i,
        title: r.title || `#${i + 1}`,
        missing,
        missingLabels: missing.map((f) => FIELD_LABELS[f] || f),
      });
    }

    // ── 检查 3: 歌名 = 视频标题 ──
    if (
      isFilled(r.name) &&
      isFilled(r.title) &&
      String(r.name).trim() === String(r.title).trim()
    ) {
      nameMatchTitle.push({
        index: i,
        title: String(r.title),
        detail: String(r.name),
      });
    }

    // ── 检查 4: 作者 = UP主
    const upName = r.uploader ? String(r.uploader).trim() : null;
    if (upName && isFilled(r.author)) {
      const authors = String(r.author)
        .split("、")
        .filter(Boolean)
        .map((a) => a.trim());
      if (authors.length === 1 && authors[0] === upName) {
        authorMatchUp.push({
          index: i,
          title: String(r.title || `#${i + 1}`),
          detail: `${r.author} = ${upName}`,
        });
      }
    }
  }

  return { pending, missingFields, nameMatchTitle, authorMatchUp };
}

export { FIELD_LABELS };
