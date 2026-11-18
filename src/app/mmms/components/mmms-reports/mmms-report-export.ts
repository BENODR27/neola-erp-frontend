// File generation stays with reports and is shared by browser actions and file-format tests.
export async function buildMaintenanceExcel(
  title: string,
  generatedAt: string,
  columns: string[],
  rows: string[][],
): Promise<Uint8Array> {
  const excel = await import('exceljs');
  const Workbook = excel.Workbook || excel.default.Workbook;
  const book = new Workbook();
  const sheet = book.addWorksheet('Maintenance report');
  sheet.addRow([title]);
  sheet.addRow(['Generated', generatedAt]);
  sheet.addRow(columns);
  rows.forEach((row) => sheet.addRow(row));
  sheet.getRow(3).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 3 }];
  sheet.columns.forEach((column) => {
    column.width = 24;
  });
  return new Uint8Array(await book.xlsx.writeBuffer());
}

export async function buildMaintenancePdf(
  title: string,
  columns: string[],
  rows: string[][],
): Promise<ArrayBuffer> {
  const { jsPDF } = await import('jspdf');
  const tableModule = await import('jspdf-autotable');
  const autoTable = tableModule.autoTable || tableModule.default;
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.text(title, 14, 15);
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 22,
    styles: { fontSize: 7, cellWidth: 'wrap' },
    horizontalPageBreak: true,
  });
  return doc.output('arraybuffer');
}
