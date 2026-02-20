import * as XLSX from "xlsx";

export function exportToExcel(records: any[], includeEntries: boolean[], _svmode: boolean, keepExcluded: boolean = false) {
  // _svmode argument kept for compatibility but logic unified
  
  const mappedRecords = records.map((item, index) => {
    const newItem = { ...item };
    newItem.include = includeEntries[index] ? '收录' : '排除';
    return newItem;
  });

  let outputRecords;
  if (keepExcluded) {
    outputRecords = mappedRecords;
  } else {
    outputRecords = mappedRecords.filter((item) => item.include === '收录');
  }

  const worksheet = XLSX.utils.json_to_sheet(outputRecords);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, "output.xlsx");
}
