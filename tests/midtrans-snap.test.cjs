/* oxlint-disable typescript/no-require-imports -- Test the real SDK loader in an isolated fake DOM without loading a provider or creating transactions. */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function loadTs(file, resolve = require, globals = {}) {
  const filename = path.join(__dirname, '..', file);
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const tsModule = { exports: {} };
  vm.runInNewContext(
    code,
    {
      module: tsModule,
      exports: tsModule.exports,
      require: resolve,
      URL,
      URLSearchParams,
      ...globals,
    },
    { filename },
  );
  return tsModule.exports;
}
const navigation = loadTs('lib/payment-navigation.ts');
const sandboxUrl =
  'https://app.sandbox.midtrans.com/snap/v4/redirection/test-token';
const productionUrl = 'https://app.midtrans.com/snap/v4/redirection/test-token';

function harness(key = 'test-client-key') {
  const scripts = [],
    timers = new Map();
  let nextTimer = 0;
  const sdk = { pay() {}, hide() {} };
  const window = {
    setTimeout: (callback, delay) => {
      const id = ++nextTimer;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
  };
  const document = {
    getElementById: (id) =>
      scripts.find((script) => script.id === id && script.isConnected) ?? null,
    createElement(tag) {
      assert.equal(tag, 'script');
      const element = new EventTarget();
      const attributes = new Map();
      element.dataset = {};
      element.isConnected = false;
      element.setAttribute = (name, value) => attributes.set(name, value);
      element.getAttribute = (name) => attributes.get(name) ?? null;
      element.remove = () => {
        element.isConnected = false;
      };
      return element;
    },
    head: {
      appendChild: (element) => {
        element.isConnected = true;
        scripts.push(element);
      },
    },
  };
  function load(newKey = key) {
    return loadTs(
      'lib/midtrans-snap.ts',
      (name) => {
        if (name === '@/lib/config') return { MIDTRANS_CLIENT_KEY: newKey };
        if (name === '@/lib/payment-navigation') return navigation;
        throw new Error(`Unexpected import: ${name}`);
      },
      { window, document },
    );
  }
  return {
    ...load(),
    scripts,
    timers,
    sdk,
    window,
    load,
    ready() {
      window.snap = sdk;
      scripts.at(-1).dispatchEvent(new Event('load'));
    },
    fail() {
      scripts.at(-1).dispatchEvent(new Event('error'));
    },
    timeout() {
      const [id, timer] = timers.entries().next().value;
      timers.delete(id);
      timer.callback();
    },
  };
}

test('SDK environment comes only from the backend Midtrans checkout host', () => {
  const h = harness();
  assert.equal(
    h.snapScriptUrl(sandboxUrl),
    'https://app.sandbox.midtrans.com/snap/snap.js',
  );
  assert.equal(
    h.snapScriptUrl(productionUrl),
    'https://app.midtrans.com/snap/snap.js',
  );
  for (const url of [
    'http://localhost/snap/test',
    'javascript:alert(1)',
    'https://app.midtrans.com.attacker.example/snap/test',
  ]) {
    assert.equal(h.snapScriptUrl(url), null);
  }
});

test('missing public key, a Server Key, or an invalid checkout never insert a script', async () => {
  for (const key of ['', 'Mid-server-not-a-client-key']) {
    const h = harness(key);
    await assert.rejects(h.loadMidtransSnap(sandboxUrl), /Client Key/);
    assert.equal(h.scripts.length, 0);
  }
  const h = harness();
  await assert.rejects(
    h.loadMidtransSnap('https://attacker.example/snap/test'),
    /tidak valid/,
  );
  assert.equal(h.scripts.length, 0);
});

test('concurrent callers share one async SDK script with its public Client Key', async () => {
  const h = harness();
  const first = h.loadMidtransSnap(sandboxUrl);
  const second = h.loadMidtransSnap(sandboxUrl);
  assert.equal(h.scripts.length, 1);
  assert.equal(h.scripts[0].async, true);
  assert.equal(h.scripts[0].getAttribute('data-client-key'), 'test-client-key');
  h.ready();
  assert.strictEqual(await first, h.sdk);
  assert.strictEqual(await second, h.sdk);
  assert.equal(h.timers.size, 0);
  assert.strictEqual(await h.loadMidtransSnap(sandboxUrl), h.sdk);
  assert.equal(h.scripts.length, 1);
});

test('a definitive network error is retryable and clears wait timers', async () => {
  const h = harness();
  const first = h.loadMidtransSnap(sandboxUrl);
  h.fail();
  await assert.rejects(first, /tidak dapat dimuat/);
  assert.equal(h.scripts[0].isConnected, false);
  assert.equal(h.timers.size, 0);
  const retry = h.loadMidtransSnap(sandboxUrl);
  assert.equal(h.scripts.length, 2);
  h.ready();
  assert.strictEqual(await retry, h.sdk);
});

test('timeout releases the caller but retry and late load never inject a second SDK', async () => {
  const h = harness();
  const first = h.loadMidtransSnap(sandboxUrl);
  assert.equal([...h.timers.values()][0].delay, 15000);
  h.timeout();
  await assert.rejects(first, /terlalu lama/);
  assert.equal(h.scripts[0].isConnected, true);
  const retry = h.loadMidtransSnap(sandboxUrl);
  assert.equal(h.scripts.length, 1);
  h.ready();
  assert.strictEqual(await retry, h.sdk);
  assert.equal(h.timers.size, 0);
  assert.equal(h.scripts.length, 1);
});

test('a partially initialized SDK is not reinjected and requests a page reload', async () => {
  const h = harness();
  const first = h.loadMidtransSnap(sandboxUrl);
  h.scripts[0].dispatchEvent(new Event('load'));
  await assert.rejects(first, /Muat ulang/);
  await assert.rejects(h.loadMidtransSnap(sandboxUrl), /Muat ulang/);
  assert.equal(h.scripts.length, 1);
});

test('environment switching fails closed rather than reusing the wrong SDK', async () => {
  const h = harness();
  const first = h.loadMidtransSnap(sandboxUrl);
  h.ready();
  await first;
  await assert.rejects(
    h.loadMidtransSnap(productionUrl),
    /Lingkungan Midtrans berubah/,
  );
  assert.equal(h.scripts.length, 1);
});

test('navigation or HMR can reuse an initialized script, but never with another Client Key', async () => {
  const h = harness();
  const first = h.loadMidtransSnap(sandboxUrl);
  h.ready();
  await first;
  assert.strictEqual(await h.load().loadMidtransSnap(sandboxUrl), h.sdk);
  assert.equal(h.scripts.length, 1);
  await assert.rejects(
    h.load('another-client-key').loadMidtransSnap(sandboxUrl),
    /Konfigurasi Midtrans berbeda/,
  );
});
