const test = require('node:test');
const assert = require('node:assert/strict');
test('maintenance exports produce readable Excel and PDF files with the selected records', async () => {
  const { buildMaintenanceExcel, buildMaintenancePdf } = require('../src/app/mmms/components/mmms-reports/mmms-report-export.ts');
  const { Workbook } = require('exceljs');
  const rows = [['M-TEST-01', 'Browser Overlock', 'Closed']];
  const columns = ['Machine code', 'Machine', 'Status'];
  const bytes = await buildMaintenanceExcel('Machine report', new Date().toISOString(), columns, rows);
  const workbook = new Workbook(); await workbook.xlsx.load(bytes);
  assert.equal(workbook.worksheets[0].getCell('A4').value, 'M-TEST-01');
  assert.equal(workbook.worksheets[0].getCell('C4').value, 'Closed');
  const pdf = Buffer.from(await buildMaintenancePdf('Machine report', columns, rows));
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.ok(pdf.toString().includes('M-TEST-01'));
});
