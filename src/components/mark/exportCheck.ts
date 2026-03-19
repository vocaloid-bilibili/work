// mark/exportCheck.ts

const FIELD_LABELS: Record<string, string> = {
  name: "歌名",
  vocal: "歌手",
  author: "作者",
  synthesizer: "引擎",
  copyright: "版权",
  type: "类别",
};

const REQUIRED_FIELDS = [
  "name",
  "vocal",
  "author",
  "synthesizer",
  "copyright",
  "type",
];
const CONSISTENCY_FIELDS = ["vocal", "author", "synthesizer", "type"];

export { FIELD_LABELS };

// ── 现有检查项类型 ──

export interface PendingItem {
  index: number;
  title: string;
}

export interface MissingFieldItem {
  index: number;
  title: string;
  missingLabels: string[];
}

export interface NameMatchTitleItem {
  index: number;
  title: string;
}

export interface AuthorMatchUpItem {
  index: number;
  title: string;
  detail: string;
}

// ── 新增检查项类型 ──

/** 同作者不同歌名（caution） */
export interface SameAuthorDiffNameGroup {
  author: string;
  songs: { index: number; name: string; title: string }[];
}

/** 同作者+同歌名但字段不一致（error） */
export interface InconsistentFieldGroup {
  key: string;
  author: string;
  name: string;
  inconsistentFields: string[];
  entries: {
    index: number;
    title: string;
    values: Record<string, string>;
  }[];
}

// ── 汇总 ──

export interface ExportCheckResult {
  pending: PendingItem[];
  missingFields: MissingFieldItem[];
  nameMatchTitle: NameMatchTitleItem[];
  authorMatchUp: AuthorMatchUpItem[];
  sameAuthorDiffName: SameAuthorDiffNameGroup[];
  inconsistentEntries: InconsistentFieldGroup[];
}

// ── 工具 ──

const isFilled = (v: unknown) =>
  v !== undefined && v !== null && String(v).trim() !== "";

const str = (v: unknown) => String(v ?? "").trim();

// ── 主函数 ──

export function runExportChecks(
  records: any[],
  includeEntries: boolean[],
  blacklistedEntries: boolean[],
): ExportCheckResult {
  const pending: PendingItem[] = [];
  const missingFields: MissingFieldItem[] = [];
  const nameMatchTitle: NameMatchTitleItem[] = [];
  const authorMatchUp: AuthorMatchUpItem[] = [];

  // 用于新检查的索引：只看已收录的
  const includedIndices: number[] = [];

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const title = str(r.title) || str(r.name) || `#${i + 1}`;
    const isIncluded = includeEntries[i];
    const isBlacklisted = blacklistedEntries[i];

    // 1. 待处理（既没收录也没排除）
    if (!isIncluded && !isBlacklisted) {
      pending.push({ index: i, title });
      continue;
    }

    if (!isIncluded) continue; // 已排除的不做后续检查

    includedIndices.push(i);

    // 2. 字段缺失
    const missing = REQUIRED_FIELDS.filter((f) => !isFilled(r[f]));
    if (missing.length > 0) {
      missingFields.push({
        index: i,
        title,
        missingLabels: missing.map((f) => FIELD_LABELS[f] || f),
      });
    }

    // 3. 歌名 = 视频标题
    if (isFilled(r.name) && isFilled(r.title) && str(r.name) === str(r.title)) {
      nameMatchTitle.push({ index: i, title });
    }

    // 4. 作者 = UP主
    if (isFilled(r.author) && isFilled(r.uploader)) {
      const authors = str(r.author)
        .split("、")
        .map((s) => s.trim());
      const up = str(r.uploader);
      if (authors.includes(up)) {
        authorMatchUp.push({
          index: i,
          title,
          detail: `作者 "${str(r.author)}" 包含UP主 "${up}"`,
        });
      }
    }
  }

  // ── 5. 同作者 + 同歌名，但字段不一致（error） ──
  const inconsistentEntries: InconsistentFieldGroup[] = [];

  // ── 6. 同作者、不同歌名（caution） ──
  const sameAuthorDiffName: SameAuthorDiffNameGroup[] = [];

  // 按 author 分组（只看已收录的、author 非空的）
  const byAuthor = new Map<
    string,
    { index: number; name: string; title: string; record: any }[]
  >();

  for (const i of includedIndices) {
    const r = records[i];
    const author = str(r.author);
    if (!author) continue;
    const title = str(r.title) || str(r.name) || `#${i + 1}`;
    const name = str(r.name);

    if (!byAuthor.has(author)) byAuthor.set(author, []);
    byAuthor.get(author)!.push({ index: i, name, title, record: r });
  }

  for (const [author, entries] of byAuthor) {
    if (entries.length < 2) continue;

    // 按歌名分组
    const byName = new Map<
      string,
      { index: number; title: string; record: any }[]
    >();
    for (const e of entries) {
      const n = e.name || "(空)";
      if (!byName.has(n)) byName.set(n, []);
      byName.get(n)!.push({ index: e.index, title: e.title, record: e.record });
    }

    // 同歌名组：检查字段一致性 → error
    for (const [name, group] of byName) {
      if (group.length < 2) continue;

      const diffFields: string[] = [];
      for (const field of CONSISTENCY_FIELDS) {
        const vals = new Set(group.map((g) => str(g.record[field])));
        if (vals.size > 1) diffFields.push(field);
      }

      if (diffFields.length > 0) {
        inconsistentEntries.push({
          key: `${author}|||${name}`,
          author,
          name,
          inconsistentFields: diffFields,
          entries: group.map((g) => ({
            index: g.index,
            title: g.title,
            values: Object.fromEntries(
              CONSISTENCY_FIELDS.map((f) => [f, str(g.record[f]) || "(空)"]),
            ),
          })),
        });
      }
    }

    // 不同歌名 → caution
    const distinctNames = [...byName.keys()];
    if (distinctNames.length >= 2) {
      sameAuthorDiffName.push({
        author,
        songs: entries.map((e) => ({
          index: e.index,
          name: e.name || "(空)",
          title: e.title,
        })),
      });
    }
  }

  return {
    pending,
    missingFields,
    nameMatchTitle,
    authorMatchUp,
    sameAuthorDiffName,
    inconsistentEntries,
  };
}
