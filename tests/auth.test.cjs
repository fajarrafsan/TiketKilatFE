const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

// Exercise the real TypeScript modules without a browser or additional dependencies.
function createHarness(fetchImpl = async () => { throw new Error('Unexpected fetch'); }) {
  const storage = new Map();
  const events = new EventTarget();
  const window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    dispatchEvent: events.dispatchEvent.bind(events),
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  };
  const cache = new Map();
  function load(name) {
    if (cache.has(name)) return cache.get(name).exports;
    const filename = path.join(__dirname, '..', name.replace('@/', '' ) + '.ts');
    const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    cache.set(name, module);
    const context = vm.createContext({
      module, exports: module.exports, require: load, window,
      process: { env: { NEXT_PUBLIC_API_BASE_URL: 'http://localhost:8090' } },
      fetch: fetchImpl, Headers, FormData, Response, CustomEvent,
    });
    vm.runInContext(source, context, { filename });
    return module.exports;
  }
  return { storage, window, session: load('@/lib/session'), api: load('@/lib/api') };
}

const session = { accessToken: 'original-token', refreshToken: 'refresh-token', role: 'USER', email: 'test@example.test' };
const json = (status, data, sukses = true) => new Response(JSON.stringify({ sukses, data, pesanNya: 'Test response' }), {
  status, headers: { 'Content-Type': 'application/json' },
});

test('stored session is validated and bound to the configured API', () => {
  const h = createHarness();
  h.session.setSession(session);
  assert.equal(h.session.getSession().accessToken, 'original-token');
  for (const value of [
    {}, { ...session, accessToken: '' }, session,
    { ...session, apiBaseUrl: 'http://localhost:8080' },
  ]) {
    h.storage.set('astracom.session', JSON.stringify(value));
    assert.equal(h.session.getSession(), null);
    assert.equal(h.storage.has('astracom.session'), false);
  }
});

test('malformed JSON and incomplete login responses cannot create a session', () => {
  const h = createHarness();
  h.storage.set('astracom.session', '{');
  assert.equal(h.session.getSession(), null);
  assert.throws(() => h.session.setSession({ role: 'USER' }), /login tidak lengkap/);
});

test('protected requests without a session stop before making a network call', async () => {
  const h = createHarness();
  await assert.rejects(h.api.apiGet('/user/profile'), (error) => error.status === 401);
});

test('concurrent 401 responses share one refresh and retry with the new token', async () => {
  let refreshes = 0;
  let originalRequests = 0;
  let retriedRequests = 0;
  const h = createHarness(async (url, options) => {
    if (url.endsWith('/auth/refresh-token')) {
      refreshes++;
      await new Promise((resolve) => setImmediate(resolve));
      return json(200, { aksesToken: 'new-token', refreshToken: 'new-refresh' });
    }
    if (options.headers.get('Authorization') === 'Bearer original-token') {
      originalRequests++;
      return json(401, null, false);
    }
    assert.equal(options.headers.get('Authorization'), 'Bearer new-token');
    retriedRequests++;
    return json(200, []);
  });
  h.session.setSession(session);
  await Promise.all([h.api.apiGet('/user/daftar-kota'), h.api.apiGet('/user/daftar-maskapai')]);
  assert.equal(refreshes, 1);
  assert.equal(originalRequests, 2);
  assert.equal(retriedRequests, 2);
  assert.equal(h.session.getSession().refreshToken, 'new-refresh');
});

test('a real permission denial remains 403 and never refreshes', async () => {
  let calls = 0;
  const h = createHarness(async () => { calls++; return json(403, null, false); });
  h.session.setSession(session);
  await assert.rejects(h.api.apiGet('/admin/dashboard'), (error) => error.status === 403);
  assert.equal(calls, 1);
  assert.ok(h.session.getSession());
});

test('failed refresh removes the session and does not loop', async () => {
  let calls = 0;
  const h = createHarness(async () => { calls++; return json(401, null, false); });
  h.session.setSession(session);
  await assert.rejects(h.api.apiGet('/user/profile'), (error) => error.status === 401);
  assert.equal(calls, 2);
  assert.equal(h.session.getSession(), null);
});
