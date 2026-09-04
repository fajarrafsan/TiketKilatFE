/* oxlint-disable typescript/no-require-imports -- Exercise the actual TypeScript modules using the existing isolated Node test harness. */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function loadTs(relative, resolve = require, globals = {}) {
  const filename = path.join(__dirname, '..', relative);
  const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const tsModule = { exports: {} };
  vm.runInNewContext(
    source,
    {
      module: tsModule,
      exports: tsModule.exports,
      require: resolve,
      URL,
      URLSearchParams,
      Error,
      AbortSignal,
      ...globals,
    },
    { filename },
  );
  return tsModule.exports;
}
const navigation = loadTs('lib/payment-navigation.ts');
const { paymentReturnPath, midtransCheckoutUrl, PAYMENT_RETURN_STORAGE_KEY } =
  navigation;
const code = 'ASTRA-1234ABCD';
const orderId = `${code}-1788388800000`;
const checkout =
  'https://app.sandbox.midtrans.com/snap/v4/redirection/test-token';
const baseReturnedPath = `/payment/${code}?from=midtrans`;
const returnedPath = `${baseReturnedPath}&order_id=${orderId}`;

test('finish return resolves the backend order ID to its booking, regardless of claimed status', () => {
  for (const status of [
    'settlement',
    'capture',
    'pending',
    'deny',
    'expire',
    'made-up',
  ]) {
    assert.equal(
      paymentReturnPath(
        `?order_id=${orderId}&transaction_status=${status}&status_code=200`,
      ),
      returnedPath,
    );
  }
  assert.equal(
    paymentReturnPath(`?order_id=${encodeURIComponent(orderId)}`),
    returnedPath,
  );
});

test('a missing order ID can use only a valid same-tab booking; otherwise go to history', () => {
  assert.equal(paymentReturnPath('', code), baseReturnedPath);
  assert.equal(
    paymentReturnPath('?transaction_status=settlement', code),
    baseReturnedPath,
  );
  assert.equal(paymentReturnPath(''), '/history');
  assert.equal(paymentReturnPath('', 'https://attacker.example'), '/history');
});

test('a supplied invalid or ambiguous order ID never falls back to another booking', () => {
  for (const value of [
    '',
    code,
    `${code}-abc`,
    `${code}-123`,
    '../admin',
    'https://attacker.example',
    `${orderId}/../admin`,
  ]) {
    assert.equal(
      paymentReturnPath(`?order_id=${encodeURIComponent(value)}`, code),
      '/history',
    );
  }
  assert.equal(
    paymentReturnPath(`?order_id=${orderId}&order_id=${orderId}`, code),
    '/history',
  );
});

test('a return from another booking takes precedence over the local fallback', () => {
  assert.equal(
    paymentReturnPath('?order_id=ASTRA-FFFFAAAA-1788388800001', code),
    '/payment/ASTRA-FFFFAAAA?from=midtrans&order_id=ASTRA-FFFFAAAA-1788388800001',
  );
});

test('checkout permits only HTTPS Snap URLs from the exact Midtrans checkout hosts', () => {
  assert.equal(midtransCheckoutUrl(checkout), checkout);
  const production =
    'https://app.midtrans.com/snap/v2/vtweb/test-token?language=id';
  assert.equal(midtransCheckoutUrl(production), production);
  for (const value of [
    null,
    {},
    '',
    '/checkout',
    'javascript:alert(1)',
    'http://app.midtrans.com/snap/test',
    'https://app.midtrans.com.attacker.example/snap/test',
    'https://app.midtrans.com@attacker.example/snap/test',
    'https://user:pass@app.midtrans.com/snap/test',
    'https://app.midtrans.com:9000/snap/test',
    'https://app.midtrans.com/other',
  ]) {
    assert.equal(midtransCheckoutUrl(value), null);
  }
});

test('callback order hints are exact booking IDs, never proof of payment or navigation targets', () => {
  assert.equal(
    navigation.snapResultOrderId({ order_id: orderId }, code),
    orderId,
  );
  assert.equal(
    navigation.snapResultOrderId(
      {
        finish_redirect_url: `http://localhost:3001/payment/finish?order_id=${orderId}`,
      },
      code,
    ),
    orderId,
  );
  for (const result of [
    null,
    'paid',
    { transaction_status: 'settlement' },
    { order_id: 'ASTRA-FFFFFFFF-1788388800000' },
    { order_id: `${orderId}/status` },
    {
      finish_redirect_url: `http://localhost:3001/?order_id=${orderId}&order_id=${orderId}`,
    },
  ]) {
    assert.equal(navigation.snapResultOrderId(result, code), null);
  }
});

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}

function contentText(tree) {
  if (typeof tree === 'string') return tree;
  if (Array.isArray(tree)) return tree.map(contentText).join('');
  return tree && typeof tree === 'object'
    ? contentText(tree.props?.children)
    : '';
}

function payButton(tree) {
  return nodes(tree).find(
    (node) =>
      node.type === 'Button' &&
      contentText(node).includes('Bayar dengan Midtrans'),
  );
}

function harness(
  file,
  {
    query = '',
    status = 'BELUM_DIBAYAR',
    storageFails = false,
    storedCheckout = checkout,
    storedOrder,
    backendOrder,
    onSync,
    onGet,
    loadSnap,
  } = {},
) {
  let cursor = 0;
  const slots = [],
    effects = [],
    cleanups = [],
    assigned = [],
    replaced = [],
    requests = [],
    posts = [],
    snapCalls = [],
    sdkRequests = [],
    hidden = [],
    focused = [];
  const intervals = new Map();
  const effectCleanup = new Map();
  let intervalId = 0;
  class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }
  const snap = {
    pay: (token, callbacks) => snapCalls.push({ token, callbacks }),
    hide: () => hidden.push(true),
  };
  const storage = new Map([
    [
      `astracom.booking.${code}`,
      JSON.stringify({
        kodeBooking: code,
        redirectUrl: storedCheckout,
        snapToken: 'sandbox-test-token',
        orderId: storedOrder,
      }),
    ],
    [PAYMENT_RETURN_STORAGE_KEY, code],
  ]);
  const router = { replace: (href) => replaced.push(href), push: () => {} };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [
        slots[index],
        (next) => {
          slots[index] = typeof next === 'function' ? next(slots[index]) : next;
        },
      ];
    },
    useCallback(callback, deps) {
      const index = cursor++;
      if (
        !slots[index] ||
        deps.some((value, i) => value !== slots[index].deps[i])
      ) {
        slots[index] = { deps, callback };
      }
      return slots[index].callback;
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((value, i) => value !== slots[index][i])) {
        slots[index] = deps;
        effects.push(() => {
          effectCleanup.get(index)?.();
          effectCleanup.set(index, callback());
        });
      }
    },
  };
  const Page = loadTs(
    file,
    (name) => {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return require(name);
      if (name === 'next/navigation')
        return { useRouter: () => router, useParams: () => ({ code }) };
      if (name === '@/lib/payment-navigation') return navigation;
      if (name === '@/lib/midtrans-snap')
        return {
          loadMidtransSnap: (url) => {
            sdkRequests.push(url);
            return loadSnap ? loadSnap(snap) : Promise.resolve(snap);
          },
        };
      if (name === '@/lib/format')
        return {
          countdownLabel: () => '15:00',
          formatDateTime: () => '10 Sep',
          formatCurrency: () => 'Rp750.000',
        };
      if (name === '@/lib/api')
        return {
          ApiError,
          apiGet: async (url) => {
            requests.push(url);
            if (onGet) await onGet();
            return {
              kodeBooking: code,
              statusPembayaran: status,
              batasWaktuPembayaran: '2099-09-10T09:00:00',
              totalHarga: 750000,
              midtransOrderId: backendOrder,
            };
          },
          apiPost: async (url, body) => {
            assert.equal(
              url,
              `/user/${code}/sync-payment`,
              'Only verified synchronization is allowed, not cancel or charge',
            );
            posts.push({ url, body });
            if (onSync) return onSync(body, ApiError);
            return {
              statusPembayaran: status,
              midtransOrderId: backendOrder ?? body?.orderId,
            };
          },
        };
      return new Proxy({}, { get: (_, key) => key });
    },
    {
      document: { getElementById: (id) => ({ focus: () => focused.push(id) }) },
      window: {
        location: { search: query, assign: (url) => assigned.push(url) },
        // No window.open implementation: trying to open another tab fails the test.
        sessionStorage: {
          getItem: (key) => {
            if (storageFails) throw new Error('Storage disabled');
            return storage.get(key) ?? null;
          },
          setItem: (key, value) => {
            if (storageFails) throw new Error('Storage disabled');
            storage.set(key, value);
          },
        },
        setInterval: (callback, delay) => {
          intervals.set(++intervalId, { callback, delay });
          return intervalId;
        },
        clearInterval: (id) => intervals.delete(id),
      },
    },
  ).default;
  const root = Page();
  const Content = nodes(root).find(
    (node) => typeof node.type === 'function',
  ).type;
  const render = () => {
    cursor = 0;
    effects.length = 0;
    return Content();
  };
  const runEffects = () => {
    for (const effect of effects) {
      const cleanup = effect();
      if (typeof cleanup === 'function') cleanups.push(cleanup);
    }
  };
  const settle = async () => {
    render();
    runEffects();
    await new Promise((resolve) => setImmediate(resolve));
    render();
    runEffects();
    await new Promise((resolve) => setImmediate(resolve));
    return render();
  };
  return {
    root,
    render,
    runEffects,
    settle,
    assigned,
    replaced,
    requests,
    posts,
    storage,
    snapCalls,
    sdkRequests,
    hidden,
    focused,
    setBackendStatus: (next) => {
      status = next;
    },
    poll: () => {
      for (const { callback, delay } of intervals.values())
        if (delay === 8000) callback();
    },
    cleanup: () => {
      cleanups.forEach((cleanup) => cleanup());
      effectCleanup.forEach((cleanup) => cleanup?.());
      effectCleanup.clear();
    },
  };
}

test('checkout opens a Snap modal without navigating or opening another tab', async () => {
  const h = harness('app/payment/[code]/page.tsx');
  const tree = await h.settle();
  const button = payButton(tree);
  assert.ok(button);
  await button.props.onClick();
  assert.deepEqual(h.assigned, []);
  assert.equal(h.snapCalls.length, 1);
  assert.equal(h.snapCalls[0].token, 'sandbox-test-token');
  assert.equal(h.snapCalls[0].callbacks.language, 'id');
  assert.equal(h.snapCalls[0].callbacks.uiMode, 'qr');
  for (const name of ['onSuccess', 'onPending', 'onError', 'onClose']) {
    assert.equal(typeof h.snapCalls[0].callbacks[name], 'function');
  }
  assert.equal(h.storage.get(PAYMENT_RETURN_STORAGE_KEY), code);
  assert.ok(h.requests.every((url) => url === `/user/${code}/detail`));
  h.cleanup();
});

test('a second payment click is ignored while the SDK or popup is active', async () => {
  let resolveSdk;
  const h = harness('app/payment/[code]/page.tsx', {
    loadSnap: (sdk) =>
      new Promise((resolve) => {
        resolveSdk = () => resolve(sdk);
      }),
  });
  const button = payButton(await h.settle());
  const opening = button.props.onClick();
  await button.props.onClick();
  assert.equal(h.sdkRequests.length, 1);
  assert.ok(contentText(h.render()).includes('Menyiapkan Midtrans'));
  resolveSdk();
  await opening;
  await button.props.onClick();
  assert.equal(h.snapCalls.length, 1);
  assert.ok(contentText(h.render()).includes('Pembayaran sedang terbuka'));
  h.cleanup();
});

test('each Snap callback releases local state and requests verified sync without hiding the SDK twice', async () => {
  for (const callback of ['onSuccess', 'onPending', 'onError', 'onClose']) {
    const h = harness('app/payment/[code]/page.tsx');
    await payButton(await h.settle()).props.onClick();
    const before = h.requests.length;
    h.snapCalls[0].callbacks[callback]({
      transaction_status: 'settlement',
      finish_redirect_url: 'https://attacker.example',
    });
    await new Promise((resolve) => setImmediate(resolve));
    const tree = h.render();
    assert.equal(h.hidden.length, 0);
    assert.equal(h.posts.length, 1);
    assert.equal(h.requests.length, before + 1);
    assert.deepEqual(h.assigned, []);
    assert.deepEqual(h.replaced, []);
    assert.equal(
      nodes(tree).find((node) => node.type === 'h1').props.children,
      'Selesaikan pembayaran',
    );
    assert.equal(payButton(tree).props.disabled, false);
    assert.deepEqual(h.focused, ['payment-status-title']);
    if (callback === 'onError')
      assert.ok(
        contentText(tree).includes('Midtrans belum dapat menyelesaikan'),
      );
    if (callback === 'onSuccess')
      assert.ok(contentText(tree).includes('belum terkonfirmasi'));
    h.cleanup();
  }
});

test('a confirmed backend payment automatically closes the active popup', async () => {
  const h = harness('app/payment/[code]/page.tsx');
  await payButton(await h.settle()).props.onClick();
  h.setBackendStatus('SUDAH_DIBAYAR');
  h.poll();
  await new Promise((resolve) => setImmediate(resolve));
  const tree = await h.settle();
  assert.equal(h.hidden.length, 1);
  assert.equal(
    nodes(tree).find((node) => node.type === 'h1').props.children,
    'Pembayaran berhasil',
  );
  assert.equal(payButton(tree), undefined);
  const before = h.requests.length;
  h.snapCalls[0].callbacks.onClose();
  assert.equal(h.requests.length, before);
  h.cleanup();
});

test('leaving during SDK loading prevents the late popup from opening', async () => {
  let resolveSdk;
  const h = harness('app/payment/[code]/page.tsx', {
    loadSnap: (sdk) =>
      new Promise((resolve) => {
        resolveSdk = () => resolve(sdk);
      }),
  });
  const opening = payButton(await h.settle()).props.onClick();
  h.cleanup();
  resolveSdk();
  await opening;
  assert.equal(h.snapCalls.length, 0);
  assert.deepEqual(h.assigned, []);
});

test('SDK load failure shows an error, enables retry, and never leaves the payment page', async () => {
  const h = harness('app/payment/[code]/page.tsx', {
    loadSnap: async () => {
      throw new Error('Memuat Midtrans terlalu lama.');
    },
  });
  await payButton(await h.settle()).props.onClick();
  const tree = h.render();
  assert.ok(contentText(tree).includes('Memuat Midtrans terlalu lama'));
  assert.equal(payButton(tree).props.disabled, false);
  assert.deepEqual(h.assigned, []);
  h.cleanup();
});

test('return route keeps authentication and uses replace without changing payment status', () => {
  const h = harness('app/payment/finish/page.tsx', {
    query: `?order_id=${orderId}&transaction_status=settlement`,
  });
  assert.equal(h.root.type, 'RouteGuard');
  assert.equal(h.root.props.role, 'USER');
  h.render();
  h.runEffects();
  assert.deepEqual(h.replaced, [returnedPath]);
  assert.deepEqual(h.requests, []);
});

test('query-free return remains idempotent if React runs the effect again', () => {
  const h = harness('app/payment/finish/page.tsx');
  h.render();
  h.runEffects();
  h.runEffects();
  assert.deepEqual(h.replaced, [baseReturnedPath, baseReturnedPath]);
});

test('an expired login preserves the complete finish URL through reauthentication', async () => {
  const finishPath = `/payment/finish?order_id=${orderId}&transaction_status=settlement`;
  const location = new URL(finishPath, 'http://localhost:3001');
  const navigations = [],
    effects = [];
  let session = null;
  const router = {
    replace(href) {
      navigations.push(href);
      location.href = new URL(href, location).href;
    },
  };
  const resolve = (name) => {
    if (name === 'react')
      return {
        useEffect: (effect) => effects.push(effect),
        useState: (initial) => [initial, () => {}],
      };
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'next/navigation')
      return {
        useRouter: () => router,
        usePathname: () => location.pathname,
      };
    if (name === '@/components/auth-provider')
      return {
        useAuth: () => ({
          ready: true,
          session,
          login: async () => {
            session = { role: 'USER' };
            return session;
          },
        }),
      };
    return new Proxy({}, { get: (_, key) => key });
  };
  const globals = { window: { location } };
  const { RouteGuard } = loadTs('components/route-guard.tsx', resolve, globals);
  const LoginPage = loadTs('app/login/page.tsx', resolve, globals).default;
  RouteGuard({ role: 'USER', children: 'protected payment return' });
  effects.shift()();
  assert.equal(location.pathname, '/login');
  assert.equal(location.searchParams.get('next'), finishPath);
  await nodes(LoginPage())
    .find((node) => node.type === 'form')
    .props.onSubmit({ preventDefault() {} });
  assert.equal(navigations.at(-1), finishPath);
  assert.equal(
    RouteGuard({ role: 'USER', children: 'protected payment return' }),
    'protected payment return',
  );
  const returned = harness('app/payment/finish/page.tsx', {
    query: location.search,
  });
  returned.render();
  returned.runEffects();
  assert.deepEqual(returned.replaced, [returnedPath]);
});

test('return route works without browser storage and falls back safely without an order ID', () => {
  for (const query of [`?order_id=${orderId}`, '']) {
    const h = harness('app/payment/finish/page.tsx', {
      query,
      storageFails: true,
    });
    h.render();
    h.runEffects();
    assert.deepEqual(h.replaced, [query ? returnedPath : '/history']);
  }
});

test('a claimed success in the URL cannot turn an unpaid backend booking into paid UI', async () => {
  const h = harness('app/payment/[code]/page.tsx', {
    query: '?from=midtrans&transaction_status=settlement&status_code=200',
  });
  const tree = await h.settle();
  assert.equal(
    nodes(tree).find((node) => node.type === 'h1').props.children,
    'Selesaikan pembayaran',
  );
  assert.ok(
    nodes(tree).some(
      (node) =>
        typeof node.props.children === 'string' &&
        node.props.children.includes('jangan bayar ulang'),
    ),
  );
  assert.ok(
    !nodes(tree).some(
      (node) => node.props.children === 'Pembayaranmu sudah terkonfirmasi',
    ),
  );
  h.cleanup();
});

test('confirmed backend payment shows success and removes the pay button', async () => {
  const h = harness('app/payment/[code]/page.tsx', {
    status: 'SUDAH_DIBAYAR',
    query: '?from=midtrans',
  });
  const tree = await h.settle();
  assert.equal(
    nodes(tree).find((node) => node.type === 'h1').props.children,
    'Pembayaran berhasil',
  );
  assert.ok(
    !nodes(tree).some((node) =>
      node.props.children?.includes?.('Bayar dengan Midtrans'),
    ),
  );
  h.cleanup();
});

test('blocked storage still loads backend status; unsafe saved URLs have no checkout action', async () => {
  for (const options of [
    { storageFails: true },
    { storedCheckout: 'javascript:alert(1)' },
  ]) {
    const h = harness('app/payment/[code]/page.tsx', options);
    const tree = await h.settle();
    assert.ok(h.requests.length > 0);
    assert.ok(
      !nodes(tree).some((node) =>
        node.props.children?.includes?.('Bayar dengan Midtrans'),
      ),
    );
    assert.deepEqual(h.assigned, []);
    h.cleanup();
  }
});

test('persisted order uses verified backend synchronization automatically and stops polling after paid', async () => {
  const h = harness('app/payment/[code]/page.tsx', {
    backendOrder: orderId,
    onSync: async () => ({
      statusPembayaran: 'SUDAH_DIBAYAR',
      midtransOrderId: orderId,
    }),
  });
  const tree = await h.settle();
  assert.equal(h.posts.length, 1);
  assert.equal(h.posts[0].body.orderId, orderId);
  assert.equal(
    nodes(tree).find((node) => node.type === 'h1').props.children,
    'Pembayaran berhasil',
  );
  assert.equal(payButton(tree), undefined);
  const before = h.requests.length;
  h.poll();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.requests.length, before);
  h.cleanup();
});

test('an authenticated sync after a success callback can recover a legacy paid booking', async () => {
  const h = harness('app/payment/[code]/page.tsx', {
    onSync: async (body) => ({
      statusPembayaran:
        body.orderId === orderId ? 'SUDAH_DIBAYAR' : 'BELUM_DIBAYAR',
      midtransOrderId: body.orderId,
    }),
  });
  await payButton(await h.settle()).props.onClick();
  h.snapCalls[0].callbacks.onSuccess({
    order_id: orderId,
    transaction_status: 'settlement',
  });
  await new Promise((resolve) => setImmediate(resolve));
  const tree = h.render();
  assert.equal(h.posts[0].body.orderId, orderId);
  assert.equal(
    nodes(tree).find((node) => node.type === 'h1').props.children,
    'Pembayaran berhasil',
  );
  assert.equal(h.hidden.length, 0);
  assert.deepEqual(h.assigned, []);
  h.cleanup();
});

test('sync errors stay visible, keep unpaid status, and offer retry instead of false success', async () => {
  const h = harness('app/payment/[code]/page.tsx', {
    storedOrder: orderId,
    onSync: async (_, ApiError) => {
      throw new ApiError(
        'Midtrans belum dapat dihubungi. Jangan bayar ulang.',
        503,
      );
    },
  });
  const tree = await h.settle();
  assert.ok(contentText(tree).includes('Midtrans belum dapat dihubungi'));
  assert.equal(
    nodes(tree).find((node) => node.type === 'h1').props.children,
    'Selesaikan pembayaran',
  );
  const retry = nodes(tree).find(
    (node) =>
      node.type === 'Button' && contentText(node).trim() === 'Periksa sekarang',
  );
  assert.equal(retry.props.disabled, false);
  await retry.props.onClick();
  assert.equal(h.posts.length, 2);
  h.cleanup();
});

test('an old running backend explains that a manual restart is needed', async () => {
  const h = harness('app/payment/[code]/page.tsx', {
    storedOrder: orderId,
    onSync: async (_, ApiError) => {
      throw new ApiError('Not found', 404);
    },
  });
  assert.ok(
    contentText(await h.settle()).includes('Restart backend secara manual'),
  );
  h.cleanup();
});

test('manual legacy recovery validates the order ID then checks the same transaction', async () => {
  const h = harness('app/payment/[code]/page.tsx');
  let tree = await h.settle();
  assert.ok(contentText(tree).includes('Pulihkan status pesanan lama'));
  nodes(tree)
    .find((node) => node.type === 'Input')
    .props.onChange({ target: { value: 'wrong-order' } });
  tree = h.render();
  nodes(tree)
    .find((node) => node.type === 'form')
    .props.onSubmit({ preventDefault() {} });
  assert.equal(h.posts.length, 0);
  tree = h.render();
  assert.ok(contentText(tree).includes('Gunakan Order ID lengkap'));
  nodes(tree)
    .find((node) => node.type === 'Input')
    .props.onChange({ target: { value: orderId } });
  nodes(h.render())
    .find((node) => node.type === 'form')
    .props.onSubmit({ preventDefault() {} });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.posts.length, 1);
  assert.equal(h.posts[0].body.orderId, orderId);
  assert.equal(
    nodes(h.render()).find((node) => node.type === 'h1').props.children,
    'Selesaikan pembayaran',
  );
  h.cleanup();
});

test('polling and manual clicks share one in-flight backend check', async () => {
  let resolveSync;
  let defer = false;
  const h = harness('app/payment/[code]/page.tsx', {
    storedOrder: orderId,
    onSync: () =>
      defer
        ? new Promise((resolve) => {
            resolveSync = resolve;
          })
        : Promise.resolve({
            statusPembayaran: 'BELUM_DIBAYAR',
            midtransOrderId: orderId,
          }),
  });
  const tree = await h.settle();
  defer = true;
  h.poll();
  await new Promise((resolve) => setImmediate(resolve));
  const retry = nodes(tree).find(
    (node) =>
      node.type === 'Button' && contentText(node).trim() === 'Periksa sekarang',
  );
  const manual = retry.props.onClick();
  h.poll();
  assert.equal(h.posts.length, 2);
  resolveSync({ statusPembayaran: 'BELUM_DIBAYAR', midtransOrderId: orderId });
  await manual;
  assert.equal(h.posts.length, 2);
  h.cleanup();
});

test('late status responses after leaving do not update the old page', async () => {
  let resolveSync;
  let defer = false;
  const h = harness('app/payment/[code]/page.tsx', {
    storedOrder: orderId,
    onSync: () =>
      defer
        ? new Promise((resolve) => {
            resolveSync = resolve;
          })
        : Promise.resolve({
            statusPembayaran: 'BELUM_DIBAYAR',
            midtransOrderId: orderId,
          }),
  });
  await h.settle();
  defer = true;
  h.poll();
  await new Promise((resolve) => setImmediate(resolve));
  h.cleanup();
  resolveSync({ statusPembayaran: 'SUDAH_DIBAYAR', midtransOrderId: orderId });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(
    nodes(h.render()).find((node) => node.type === 'h1').props.children,
    'Selesaikan pembayaran',
  );
});
