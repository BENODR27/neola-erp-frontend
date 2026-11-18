const test = require('node:test');
const assert = require('node:assert/strict');
test('MMMS pagination handles boundaries, changed filters and page sizes without dropping records', () => {
  const { MmmsPagination } = require('../src/app/mmms/components/mmms-pagination/mmms-pagination.ts');
  const pager = new MmmsPagination();
  const rows = Array.from({ length: 61 }, (_, i) => i + 1);
  assert.deepEqual(pager.slice(rows), rows.slice(0, 25));
  pager.page.set(3); assert.deepEqual(pager.slice(rows), rows.slice(50));
  assert.equal(pager.currentPage(3), 1); assert.deepEqual(pager.slice([1, 2, 3]), [1, 2, 3]);
  assert.deepEqual(pager.slice([]), []); assert.equal(pager.pageCount(0), 1);
  pager.resize(10); assert.equal(pager.page(), 1); assert.equal(pager.pageCount(rows.length), 7);
  const collected = []; for (let page = 1; page <= 7; page++) { pager.page.set(page); collected.push(...pager.slice(rows)); }
  assert.deepEqual(collected, rows);
  pager.resize(0); assert.equal(pager.pageSize(), 10);
  pager.page.set(999); assert.deepEqual(pager.slice(rows), [61]);
});
