// src/modules/marking/state/exportExcel.ts
import ExcelJS from "exceljs";

export async function exportExcel(
  records: any[],
  includes: boolean[],
  keepExcluded: boolean,
  name?: string,
) {
  const mapped = records.map((item, i) => {
    const o = { ...item, include: includes[i] ? "收录" : "排除" };
    for (const k of Object.keys(o)) {
      if (k.startsWith("_unconfirmed_")) delete o[k];
    }
    return o;
  });
  const out = keepExcluded
    ? mapped
    : mapped.filter((r) => r.include === "收录");
  if (out.length === 0) return;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");

  const keys = Object.keys(out[0]);
  ws.columns = keys.map((k) => ({ header: k, key: k, width: 18 }));
  for (const row of out) ws.addRow(row);

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name || "output.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}
