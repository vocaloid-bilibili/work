// src/utils/excel.ts

import * as XLSX from "xlsx";

export function exportToExcel(
  records: any[],
  includeEntries: boolean[],
  _unused: boolean, // 保持兼容，不再使用
  keepExcluded: boolean = false,
) {
  const mappedRecords = records.map((item, index) => {
    const newItem = { ...item };
    newItem.include = includeEntries[index] ? "收录" : "排除";
    Object.keys(newItem).forEach((key) => {
      if (key.startsWith("_unconfirmed_")) delete newItem[key];
    });
    return newItem;
  });

  const outputRecords = keepExcluded
    ? mappedRecords
    : mappedRecords.filter((item) => item.include === "收录");

  const worksheet = XLSX.utils.json_to_sheet(outputRecords);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, "output.xlsx");
}
