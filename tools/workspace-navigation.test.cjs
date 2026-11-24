const test = require('node:test');
const assert = require('node:assert/strict');
const {
  coversHierarchyPermission,
} = require('../src/app/shared/services/masters/masters-permissions.ts');
test('existing Masters sessions recognize finite hierarchy bundles without widening page grants', () => {
  assert.ok(coversHierarchyPermission(['MASTERS-READ'], 'MASTERS-FACTORIES-READ'));
  assert.ok(coversHierarchyPermission(['MASTERS-MANAGE'], 'MASTERS-FLOORS-MANAGE'));
  assert.ok(coversHierarchyPermission(['MASTERS-ADMIN'], 'MASTERS-COMPANIES-MANAGE'));
  assert.ok(!coversHierarchyPermission(['MASTERS-MANAGE'], 'MASTERS-COMPANIES-MANAGE'));
  assert.ok(!coversHierarchyPermission(['MASTERS-DEPARTMENTS-READ'], 'MASTERS-FACTORIES-READ'));
  assert.ok(!coversHierarchyPermission(['MASTERS-READ'], 'MASTERS-UNKNOWN-READ'));
  assert.ok(!coversHierarchyPermission(['MASTERS-READ'], 'MASTERS-FACTORIES-MANAGE'));
});
const {
  navigationForUrl,
} = require('../src/app/shared/services/shared-service/workspace-navigation.ts');
test('navigation comes solely from permitted IAM records across reloads and app switches', () => {
  const item = {
    label: 'Custom factory assets',
    link: '/mmms/machines?view=active#list',
    icon: 'bi-cpu',
    permission: 'MMMS-MACHINES',
  };
  const catalog = [
    { applicationName: 'Vendor maintenance', landingRoute: '/mmms', navbarItems: [item] },
    {
      applicationName: 'Warehouse',
      landingRoute: '/wms/welcome',
      navbarItems: [{ label: 'Receipts', link: '/wms/fabric/receive', permission: 'WMS-RECEIVE' }],
    },
    {
      applicationName: 'Identity',
      landingRoute: '/adminv2/welcome',
      navbarItems: [{ label: 'My IAM users', link: '/admin/user', permission: 'users:manage' }],
    },
  ];
  assert.deepEqual(navigationForUrl(catalog, '/mmms/machines/123'), [item]);
  assert.equal(navigationForUrl(catalog, '/wms/fabric/receive')[0].label, 'Receipts');
  assert.equal(navigationForUrl(catalog, '/adminv2/user')[0].link, '/adminv2/user');
  assert.deepEqual(navigationForUrl(catalog, '/appearance'), []);
  assert.deepEqual(
    navigationForUrl(catalog, '/home'),
    [],
    'Common Home must not inherit the IAM menu',
  );
  assert.deepEqual(
    navigationForUrl(catalog, '/applications'),
    [],
    'The common app catalog must not inherit the IAM menu',
  );
  assert.deepEqual(navigationForUrl(catalog, '/adminv2/applications'), []);
  assert.deepEqual(navigationForUrl([], '/mmms/machines'), []);
  assert.deepEqual(navigationForUrl([{ ...catalog[0], landingRoute: null }], '/mmms'), []);
  assert.deepEqual(navigationForUrl(catalog, '/mmms-other'), []);
});
