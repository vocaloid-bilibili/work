// src/workers/xlsx.worker.ts
import ExcelJS from "exceljs";

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
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v);
  }
  if (typeof v === "string" && v.startsWith("http://"))
    return v.replace(/^http:\/\//, "https://");
  return v;
}

self.onmessage = async (e: MessageEvent) => {
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(e.data.file);
    const ws = wb.worksheets[0];
    if (!ws) {
      self.postMessage([]);
      return;
    }

    const headers: string[] = [];
    ws.getRow(1).eachCell((cell, col) => {
      headers[col - 1] = String(cell.value ?? "").trim();
    });

    const rows: Record<string, unknown>[] = [];
    ws.eachRow((row, rowNum) => {
      if (rowNum === 1) return;
      const o: Record<string, unknown> = {};
      for (const h of headers) {
        if (h) o[h] = "";
      }
      row.eachCell((cell, col) => {
        const key = headers[col - 1];
        if (key) o[key] = clean(cell.value);
      });
      rows.push(o);
    });

    self.postMessage(rows);
  } catch (err: any) {
    self.postMessage({ error: err.message || "解析失败" });
  }
};
