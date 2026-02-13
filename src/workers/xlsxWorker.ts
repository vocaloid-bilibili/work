// xlsxWorker.ts (ESM Worker)
import * as XLSX from "xlsx";

self.onmessage = (e: MessageEvent) => {
  const { file } = e.data;
  const data = new Uint8Array(file);
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  self.postMessage(records);
};
