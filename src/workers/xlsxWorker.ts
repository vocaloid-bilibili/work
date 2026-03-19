// xlsxWorker.ts (ESM Worker)
import * as XLSX from "xlsx";

function cleanValue(val: unknown): unknown {
  if (val === null || val === undefined) return "";

  if (typeof val === "object" && val !== null) {
    if ("richText" in (val as any)) {
      const rt = (val as any).richText;
      return Array.isArray(rt)
        ? rt.map((s: any) => String(s?.text ?? "")).join("")
        : "";
    }
    if ("result" in (val as any)) return cleanValue((val as any).result);
    if ("hyperlink" in (val as any)) return (val as any).text || "";
    return String(val);
  }

  if (typeof val === "string" && val.startsWith("http://")) {
    return val.replace(/^http:\/\//, "https://");
  }

  return val;
}

self.onmessage = (e: MessageEvent) => {
  const { file } = e.data;
  const data = new Uint8Array(file);
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  const cleaned = (records as Record<string, unknown>[]).map((r) => {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) {
      obj[k] = cleanValue(v);
    }
    return obj;
  });

  self.postMessage(cleaned);
};
