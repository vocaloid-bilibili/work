import * as XLSX from "xlsx";

// 导出 Excel
export function exportToExcel(records: any[], includeEntries: boolean[], svmode: boolean) {
  let outputRecords;
  if (svmode) {
    outputRecords = records.map((item, index) => {
      // Create a copy to avoid mutation
      const newItem = { ...item };
      newItem.include = includeEntries[index] ? '收录' : '排除'
      return newItem
    });
  } else {
    outputRecords = records.filter((_, index) => includeEntries[index]);
    // Validate records if needed (kept simple here based on user request "lightweight")
    // validateRecords(outputRecords); 
  }
  const worksheet = XLSX.utils.json_to_sheet(outputRecords);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, "output.xlsx");
}
