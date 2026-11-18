const test = require('node:test');
const assert = require('node:assert/strict');
test('appearance resolves account, personal and device modes and legible accent text', () => {
  const {
    resolveThemeMode,
    primaryTextColor,
    DEFAULT_THEME,
  } = require('../src/app/shared/services/theme/theme.models.ts');
  assert.equal(resolveThemeMode('inherit', 'dark', false), 'dark');
  assert.equal(resolveThemeMode('inherit', 'system', true), 'dark');
  assert.equal(resolveThemeMode('system', 'dark', false), 'light');
  assert.equal(resolveThemeMode('light', 'dark', true), 'light');
  assert.equal(resolveThemeMode('dark', 'light', false), 'dark');
  assert.equal(primaryTextColor('#ffffff'), '#000000');
  assert.equal(primaryTextColor('#000000'), '#ffffff');
  const { contrast } = require('../../authguardv2-node/src/services/appearance-validation');
  for (const accent of ['#777777', '#888888', '#365fbd', '#8caeff', '#ffffff', '#000000'])
    assert.ok(
      contrast(accent, primaryTextColor(accent)) >= 4.5,
      'Accent labels must remain readable on ' + accent,
    );
  assert.deepEqual(
    DEFAULT_THEME,
    require('../../authguardv2-node/src/services/appearance-validation').defaultTheme,
  );
});
