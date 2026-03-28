// src/modules/marking/state/exportExcel.ts
import * as XLSX from "xlsx";

export function exportExcel(
  records: any[],
  includes: boolean[],
  keepExcluded: boolean,
  name?: string,
) {
  const mapped = records.map((item, i) => {
    const o = { ...item, include: includes[i] ? "收录" : "排除" };
    Object.keys(o).forEach((k) => {
      if (k.startsWith("_unconfirmed_")) delete o[k];
    });
    return o;
  });
  const out = keepExcluded
    ? mapped
    : mapped.filter((r) => r.include === "收录");
  const ws = XLSX.utils.json_to_sheet(out);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, name || "output.xlsx");
}
