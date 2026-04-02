// src/core/helpers/sanitize.ts
export function sanitizeCell(val: unknown): unknown {
  if (val == null) return "";
  if (Array.isArray(val)) {
    return val.map((v) => sanitizeCell(v)).join(", ");
  }
  if (typeof val === "object") {
    const o = val as Record<string, unknown>;
    if ("richText" in o) {
      const rt = o.richText;
      return Array.isArray(rt)
        ? rt.map((s: any) => String(s?.text ?? "")).join("")
        : "";
    }
    if ("result" in o) return sanitizeCell(o.result);
    if ("hyperlink" in o) return (o as any).text || (o as any).hyperlink || "";
    if (val instanceof Date) return val.toISOString().slice(0, 10);
    try {
      return JSON.stringify(val);
    } catch {
      return "";
    }
  }
  if (typeof val === "string" && val.startsWith("http://"))
    return val.replace(/^http:\/\//, "https://");
  return val;
}

export function sanitizeRow(
  r: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(r)) out[k] = sanitizeCell(v);
  return out;
}

export const filled = (v: unknown) => v != null && String(v).trim() !== "";
