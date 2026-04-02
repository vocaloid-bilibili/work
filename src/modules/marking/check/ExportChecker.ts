// src/modules/marking/check/ExportChecker.ts
import { FIELD_LABELS } from "./checkTypes";
import type { CheckResult } from "./checkTypes";

const REQ = ["name", "vocal", "author", "synthesizer", "copyright", "type"];
const CONS = ["vocal", "author", "synthesizer", "type"];

const ok = (v: unknown) => v != null && String(v).trim() !== "";
const str = (v: unknown) => String(v ?? "").trim();

export function runChecks(
  records: any[],
  inc: boolean[],
  bl: boolean[],
): CheckResult {
  const pending: CheckResult["pending"] = [];
  const missingFields: CheckResult["missingFields"] = [];
  const nameMatchTitle: CheckResult["nameMatchTitle"] = [];
  const authorMatchUp: CheckResult["authorMatchUp"] = [];
  const incIdx: number[] = [];

  const strOf = (i: number, f: string): string => str(records[i]?.[f]);

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const title = strOf(i, "title") || strOf(i, "name") || `#${i + 1}`;
    if (!inc[i] && !bl[i]) {
      pending.push({ index: i, title });
      continue;
    }
    if (!inc[i]) continue;
    incIdx.push(i);
    const miss = REQ.filter((f) => !ok(r[f]));
    if (miss.length)
      missingFields.push({
        index: i,
        title,
        missingLabels: miss.map((f) => FIELD_LABELS[f] || f),
      });
    if (ok(r.name) && ok(r.title) && strOf(i, "name") === strOf(i, "title"))
      nameMatchTitle.push({ index: i, title });
    if (ok(r.author) && ok(r.uploader)) {
      const au = strOf(i, "author")
        .split("、")
        .map((s) => s.trim());
      if (au.includes(strOf(i, "uploader")))
        authorMatchUp.push({
          index: i,
          title,
          detail: `作者 "${strOf(i, "author")}" 含UP主 "${strOf(i, "uploader")}"`,
        });
    }
  }

  const inconsistentEntries: CheckResult["inconsistentEntries"] = [];
  const sameAuthorDiffName: CheckResult["sameAuthorDiffName"] = [];
  const byAuth = new Map<
    string,
    { index: number; name: string; title: string; record: any }[]
  >();
  for (const i of incIdx) {
    const r = records[i];
    const a = strOf(i, "author");
    if (!a) continue;
    const t = strOf(i, "title") || strOf(i, "name") || `#${i + 1}`;
    if (!byAuth.has(a)) byAuth.set(a, []);
    byAuth
      .get(a)!
      .push({ index: i, name: strOf(i, "name"), title: t, record: r });
  }
  for (const [author, entries] of byAuth) {
    if (entries.length < 2) continue;
    const byN = new Map<string, typeof entries>();
    for (const e of entries) {
      const n = e.name || "(空)";
      if (!byN.has(n)) byN.set(n, []);
      byN.get(n)!.push(e);
    }
    for (const [name, g] of byN) {
      if (g.length < 2) continue;
      const diff = CONS.filter(
        (f) => new Set(g.map((x) => str(x.record[f]))).size > 1,
      );
      if (diff.length)
        inconsistentEntries.push({
          key: `${author}|||${name}`,
          author,
          name,
          inconsistentFields: diff,
          entries: g.map((x) => ({
            index: x.index,
            title: x.title,
            values: Object.fromEntries(
              CONS.map((f) => [f, str(x.record[f]) || "(空)"]),
            ),
          })),
        });
    }
    if ([...byN.keys()].length >= 2)
      sameAuthorDiffName.push({
        author,
        songs: entries.map((e) => ({
          index: e.index,
          name: e.name || "(空)",
          title: e.title,
        })),
      });
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

export { FIELD_LABELS };
