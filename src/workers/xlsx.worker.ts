// src/workers/xlsx.worker.ts
import * as XLSX from "xlsx";

function clean(v: unknown): unknown {
  if (v == null) return "";
  if (typeof v === "object") {
    const o = v as any;
    if ("richText" in o)
      return Array.isArray(o.richText)
        ? o.richText.map((s: any) => String(s?.text ?? "")).join("")
        : "";
    if ("result" in o) return clean(o.result);
    if ("hyperlink" in o) return o.text || "";
    return String(v);
  }
  if (typeof v === "string" && v.startsWith("http://"))
    return v.replace(/^http:\/\//, "https://");
  return v;
}

self.onmessage = (e: MessageEvent) => {
  const wb = XLSX.read(new Uint8Array(e.data.file), { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<
    string,
    unknown
  >[];
  self.postMessage(
    raw.map((r) => {
      const o: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(r)) o[k] = clean(v);
      return o;
    }),
  );
};
