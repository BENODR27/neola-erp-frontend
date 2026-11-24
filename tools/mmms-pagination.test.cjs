const test = require('node:test');
const assert = require('node:assert/strict');
test('MMMS pagination handles boundaries, changed filters and page sizes without dropping records', () => {
  const {
    MmmsPagination,
  } = require('../src/app/mmms/components/mmms-pagination/mmms-pagination.ts');
  const pager = new MmmsPagination();
  const rows = Array.from({ length: 61 }, (_, i) => i + 1);
  assert.deepEqual(pager.slice(rows), rows.slice(0, 25));
  pager.page.set(3);
  assert.deepEqual(pager.slice(rows), rows.slice(50));
  assert.equal(pager.currentPage(3), 1);
  assert.deepEqual(pager.slice([1, 2, 3]), [1, 2, 3]);
  assert.deepEqual(pager.slice([]), []);
  assert.equal(pager.pageCount(0), 1);
  pager.resize(10);
  assert.equal(pager.page(), 1);
  assert.equal(pager.pageCount(rows.length), 7);
  const collected = [];
  for (let page = 1; page <= 7; page++) {
    pager.page.set(page);
    collected.push(...pager.slice(rows));
  }
  assert.deepEqual(collected, rows);
  pager.resize(0);
  assert.equal(pager.pageSize(), 10);
  pager.page.set(999);
  assert.deepEqual(pager.slice(rows), [61]);
});

test('server pagination uses server totals, cancels stale reads and recovers after deleting a last-page row', async () => {
  const {
    MmmsPagination,
  } = require('../src/app/mmms/components/mmms-pagination/mmms-pagination.ts');
  const { Subject, of } = require('rxjs');
  let reloads = 0;
  const pager = new MmmsPagination(() => reloads++);
  const stale = new Subject();
  const received = [];
  pager.read(stale).subscribe((rows) => received.push(rows));
  pager.page.set(3);
  pager
    .read(of({ result: [51], total: 51, page: 3, pageSize: 25, totalPages: 3 }))
    .subscribe((rows) => received.push(rows));
  stale.next({ result: ['stale'], total: 999 });
  assert.deepEqual(received, [[51]]);
  assert.equal(pager.total(), 51);
  assert.deepEqual(pager.slice([51]), [51], 'Server pages must never be sliced a second time');
  pager.read(of({ result: [], total: 50, page: 3, pageSize: 25, totalPages: 2 })).subscribe();
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.equal(pager.page(), 2);
  assert.equal(reloads, 1);
  pager.resize(10);
  assert.equal(pager.page(), 1);
  assert.deepEqual(pager.query({ search: 'needle' }), { page: 1, pageSize: 10, search: 'needle' });
  pager.destroy();
});
