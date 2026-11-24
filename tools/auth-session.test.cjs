const test = require('node:test');
const assert = require('node:assert/strict');
const {
  readAuthSession,
  writeAuthSession,
  clearAuthStorage,
} = require('../src/app/auth/services/auth-session.persistence.ts');
const key = 'auth_session';
const contextKeys = ['token', 'username', 'currentEmpId', 'userId', 'permissions'];
function storage() {
  const values = new Map();
  return {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => values.set(name, String(value)),
    removeItem: (name) => values.delete(name),
  };
}
const session = (expires = Date.now() / 1000 + 3600) => ({
  accessToken: `header.${Buffer.from(JSON.stringify({ exp: expires })).toString('base64url')}.signature`,
  user: { username: '00123', permissions: ['MMMS-APP'] },
});

test('unchecked login survives reload in its tab without persisting into a new browser session', () => {
  const local = storage(),
    tab = storage(),
    value = session();
  writeAuthSession(value, false, local, tab, key, contextKeys);
  assert.equal(local.getItem(key), null);
  assert.deepEqual(readAuthSession(local, tab, key, contextKeys), value);
  assert.equal(readAuthSession(local, storage(), key, contextKeys), null);
});

test('Remember me restores the IAM session in a fresh tab and switching it off removes old persistent credentials', () => {
  const local = storage(),
    tab = storage(),
    value = session();
  writeAuthSession(value, true, local, tab, key, contextKeys);
  assert.equal(tab.getItem(key), null);
  assert.deepEqual(readAuthSession(local, storage(), key, contextKeys), value);
  local.setItem('token', 'legacy-token');
  local.setItem('username', 'old-user');
  writeAuthSession(value, false, local, tab, key, contextKeys);
  assert.equal(local.getItem(key), null);
  assert.equal(local.getItem('token'), null);
  assert.equal(local.getItem('username'), null);
});

test('expired and malformed sessions are discarded without falling back to another stored account', () => {
  const local = storage(),
    tab = storage();
  for (const raw of ['broken-json', '{}', JSON.stringify(session(Date.now() / 1000 - 1))]) {
    local.setItem(key, JSON.stringify(session()));
    tab.setItem(key, raw);
    assert.equal(readAuthSession(local, tab, key, contextKeys), null);
    assert.equal(local.getItem(key), null);
    assert.equal(tab.getItem(key), null);
  }
});

test('logout clears both session locations and identity metadata while preserving appearance and device data', () => {
  const local = storage(),
    tab = storage();
  for (const store of [local, tab]) {
    for (const name of [key, ...contextKeys]) store.setItem(name, 'private');
    store.setItem('appearance', 'dark');
  }
  clearAuthStorage(local, tab, key, contextKeys);
  for (const store of [local, tab]) {
    for (const name of [key, ...contextKeys]) assert.equal(store.getItem(name), null);
    assert.equal(store.getItem('appearance'), 'dark');
  }
});
