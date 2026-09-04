/* oxlint-disable typescript/no-require-imports -- Node's CommonJS harness exercises actual TypeScript without another test runner. */
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
      URLSearchParams,
      Error,
      ...globals,
    },
    { filename },
  );
  return tsModule.exports;
}
const search = loadTs('lib/flight-search.ts');
const catalog = loadTs('lib/flight-catalog.ts', (name) =>
  name === '@/lib/flight-search' ? search : require(name),
);
const plain = (value) => JSON.parse(JSON.stringify(value));
const ids = (flights) => Array.from(flights, (flight) => flight.id);
const flight = (id, price, departure, arrival) => ({
  id,
  hargaTiket: price,
  waktuKeberangkatan: departure,
  waktuKedatangan: arrival,
  maskapai: 'Garuda Indonesia',
  kotaKeberangkatan: 'Jakarta',
  kotaTujuan: 'Denpasar',
});
const inventory = [
  flight(3, 1250000, '2026-09-11T06:00:00', '2026-09-11T07:30:00'),
  flight(1, 750000, '2026-09-10T23:00:00', '2026-09-11T01:00:00'),
  flight(2, 750000, '2026-09-10T12:00:00', '2026-09-10T15:00:00'),
];

test('catalog preserves all search query fields and omits an empty trailing query', () => {
  const values = {
    from: 'Jakarta',
    to: 'Denpasar',
    date: '2026-09-10',
    airline: 'Garuda Indonesia',
  };
  const url = new URL(search.flightSearchHref(values), 'http://localhost');
  assert.deepEqual(plain(catalog.readFlightSearch(url.search)), values);
  assert.equal(
    catalog.catalogApiPath(catalog.emptyFlightSearch),
    '/user/melihat-penerbangan-tersedia',
  );
  assert.equal(
    catalog.catalogApiPath(values),
    `/user/melihat-penerbangan-tersedia${url.search}`,
  );
  assert.equal(
    search.validateHomeSearch(catalog.emptyFlightSearch, '2026-09-02'),
    null,
  );
});

test('metadata options preserve query-selected values without duplicate or blank options', () => {
  assert.deepEqual(
    plain(
      catalog.mergeSearchOptions(
        ['Jakarta', 'Denpasar'],
        ['Jakarta', ''],
        ['Ambon'],
      ),
    ),
    ['Jakarta', 'Denpasar', 'Ambon'],
  );
});

test('price, duration, and departure sorts are deterministic and do not mutate inventory', () => {
  assert.deepEqual(ids(catalog.sortCatalog(inventory, 'price')), [2, 1, 3]);
  assert.deepEqual(ids(catalog.sortCatalog(inventory, 'duration')), [3, 1, 2]);
  assert.deepEqual(ids(catalog.sortCatalog(inventory, 'departure')), [2, 1, 3]);
  assert.deepEqual(ids(inventory), [3, 1, 2]);
  const tied = [
    flight(8, 1, '2026-09-10T12:00:00', '2026-09-10T13:00:00'),
    flight(7, 1, '2026-09-10T12:00:00', '2026-09-10T13:00:00'),
  ];
  assert.deepEqual(ids(catalog.sortCatalog(tied, 'price')), [7, 8]);
});

test('unknown values sort last rather than being promoted as cheapest or fastest', () => {
  const unknown = flight(9, NaN, 'invalid', 'invalid');
  for (const sort of ['price', 'duration', 'departure']) {
    assert.equal(
      catalog.sortCatalog([unknown, ...inventory], sort).at(-1).id,
      9,
    );
  }
  assert.equal(
    catalog.flightDuration(
      flight(10, 1, '2026-09-10T12:00:00', '2026-09-10T11:00:00'),
    ),
    Infinity,
  );
});

test('budget is inclusive and combines with selected departure periods', () => {
  assert.deepEqual(
    ids(catalog.filterCatalog(inventory, { maxPrice: 750000, periods: [] })),
    [1, 2],
  );
  assert.deepEqual(
    ids(
      catalog.filterCatalog(inventory, {
        maxPrice: 750000,
        periods: ['evening', 'morning'],
      }),
    ),
    [1],
  );
  assert.deepEqual(
    ids(catalog.filterCatalog(inventory, { maxPrice: 0, periods: [] })),
    [3, 1, 2],
  );
});

test('departure period boundaries use the schedule clock, including midnight', () => {
  for (const [time, expected] of [
    ['00:00', 'night'],
    ['05:59', 'night'],
    ['06:00', 'morning'],
    ['11:59', 'morning'],
    ['12:00', 'afternoon'],
    ['17:59', 'afternoon'],
    ['18:00', 'evening'],
    ['23:59', 'evening'],
  ]) {
    assert.equal(catalog.departurePeriod(`2026-09-10T${time}:00`), expected);
  }
  assert.equal(catalog.departurePeriod('invalid'), null);
});

test('overnight flights show their arrival day offset and retain the booking contract', () => {
  const selected = inventory[1];
  assert.equal(catalog.arrivalDayOffset(selected), 1);
  assert.equal(catalog.arrivalDayOffset(inventory[0]), 0);
  const url = new URL(catalog.flightBookingHref(selected), 'http://localhost');
  assert.equal(url.pathname, '/booking');
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    id: '1',
    maskapai: 'Garuda Indonesia',
    dari: 'Jakarta',
    ke: 'Denpasar',
    berangkat: '2026-09-10T23:00:00',
    tiba: '2026-09-11T01:00:00',
    harga: '750000',
  });
});

function hookHarness(query = '') {
  const slots = [],
    effects = [],
    requests = [],
    urls = [];
  let cursor = 0;
  let firstRender = true;
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
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useCallback: (callback) => callback,
    useEffect: (callback) => {
      if (firstRender) effects.push(callback);
    },
  };
  const apiGet = (url) =>
    new Promise((resolve, reject) => {
      requests.push({ url, resolve, reject });
    });
  const { useFlightCatalog } = loadTs(
    'hooks/use-flight-catalog.ts',
    (name) => {
      if (name === 'react') return react;
      if (name === '@/lib/api') return { apiGet };
      if (name === '@/lib/flight-catalog') return catalog;
      if (name === '@/lib/flight-search') return search;
      return require(name);
    },
    {
      queueMicrotask,
      window: {
        location: { search: query },
        history: { replaceState: (_state, _title, url) => urls.push(url) },
      },
    },
  );
  const render = () => {
    cursor = 0;
    // oxlint-disable-next-line react-hooks/rules-of-hooks -- The isolated harness supplies React's state/ref primitives for this hook.
    const state = useFlightCatalog();
    firstRender = false;
    return state;
  };
  render();
  return { render, requests, urls, mount: () => effects[0]() };
}

test('newest search wins when an earlier request finishes later', async () => {
  const h = hookHarness();
  const older = h
    .render()
    .search({ ...catalog.emptyFlightSearch, to: 'Jakarta' });
  const newer = h
    .render()
    .search({ ...catalog.emptyFlightSearch, to: 'Denpasar' });
  h.requests[1].resolve([inventory[1]]);
  await newer;
  h.requests[0].resolve([inventory[0]]);
  await older;
  assert.deepEqual(ids(h.render().flights), [1]);
  assert.equal(h.render().applied.to, 'Denpasar');
  assert.equal(h.render().loading, false);
  assert.deepEqual(h.urls, ['/flights?ke=Denpasar']);
});

test('stale failures cannot replace successful results or stop a pending newer search', async () => {
  const h = hookHarness();
  const older = h.render().search(catalog.emptyFlightSearch);
  const newer = h
    .render()
    .search({ ...catalog.emptyFlightSearch, from: 'Jakarta' });
  h.requests[0].reject(new Error('stale error'));
  await older;
  assert.equal(h.render().loading, true);
  assert.equal(h.render().error, '');
  h.requests[1].resolve(inventory);
  await newer;
  assert.equal(h.render().flights.length, 3);
  assert.equal(h.render().loading, false);
});

test('failed searches expose a retryable error and clear outdated results', async () => {
  const h = hookHarness();
  const success = h.render().search(catalog.emptyFlightSearch);
  h.requests[0].resolve(inventory);
  await success;
  const failure = h.render().search(catalog.emptyFlightSearch);
  h.requests[1].reject(new Error('Server belum tersedia'));
  await failure;
  assert.equal(h.render().error, 'Server belum tersedia');
  assert.equal(h.render().flights.length, 0);
  assert.equal(h.render().loading, false);
});

test('query-selected cities and airline remain available when metadata requests fail', async () => {
  const h = hookHarness('?dari=Ambon&ke=Sorong&maskapai=Maskapai+Uji');
  const cleanup = h.mount();
  await new Promise((resolve) => setImmediate(resolve));
  for (const request of h.requests) {
    if (request.url.includes('melihat-penerbangan')) request.resolve([]);
    else request.reject(new Error('metadata unavailable'));
  }
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(h.render().cities.includes('Ambon'));
  assert.ok(h.render().cities.includes('Sorong'));
  assert.ok(h.render().airlines.includes('Maskapai Uji'));
  assert.equal(h.render().error, '');
  cleanup();
});

test('unmount invalidates outstanding flight responses and prevents URL updates', async () => {
  const h = hookHarness();
  const cleanup = h.mount();
  await new Promise((resolve) => setImmediate(resolve));
  cleanup();
  for (const request of h.requests) request.resolve(inventory);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.render().flights.length, 0);
  assert.deepEqual(h.urls, []);
});

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
function headerTree(
  pathname,
  role = 'USER',
  logout = async () => {},
  props = {},
) {
  const redirects = [];
  const { SiteHeader } = loadTs('components/site-header.tsx', (name) => {
    if (name === 'react') return { useState: () => [false, () => {}] };
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'next/navigation')
      return {
        usePathname: () => pathname,
        useRouter: () => ({ replace: (url) => redirects.push(url) }),
      };
    if (name === 'next/link') return { __esModule: true, default: 'a' };
    if (name === '@/components/auth-provider')
      return {
        useAuth: () => ({
          session: role ? { role, email: 'test@example.com' } : null,
          logout,
        }),
      };
    if (name === '@/lib/utils')
      return { cn: (...values) => values.filter(Boolean).join(' ') };
    return new Proxy({}, { get: (_, key) => key });
  });
  return { tree: SiteHeader(props), redirects };
}
const hrefs = (tree) =>
  nodes(tree)
    .map((node) => node.props?.href ?? node.props?.render?.props?.href)
    .filter(Boolean);

test('home and flights use the same header implementation and consumer destinations', () => {
  const source = (file) =>
    readFileSync(path.join(__dirname, '..', file), 'utf8');
  for (const file of ['app/page.tsx', 'components/app-shell.tsx'])
    assert.match(source(file), /<SiteHeader\b/);
  assert.match(
    source('components/home-header.tsx'),
    /SiteHeader as HomeHeader/,
  );
  assert.deepEqual(
    hrefs(headerTree('/').tree),
    hrefs(headerTree('/flights').tree),
  );
  for (const target of ['/flights', '/history', '/profile', '/'])
    assert.ok(hrefs(headerTree('/flights').tree).includes(target));
  assert.ok(
    !hrefs(headerTree('/flights').tree).some((href) => href.startsWith('/#')),
  );
  for (const type of ['DestinationMenu', 'BookingGuideMenu']) {
    assert.equal(
      nodes(headerTree('/flights').tree).filter((node) => node.type === type)
        .length,
      2,
    );
  }
  assert.equal(
    nodes(headerTree('/flights').tree).filter(
      (node) => node.props?.['aria-current'] === 'page',
    ).length,
    2,
  );
});

test('catalog ticket navigation focuses search and retains its query for new tabs', () => {
  let focused = 0;
  const searchHref = '/flights?dari=Jakarta&ke=Denpasar&maskapai=Citilink';
  const { tree } = headerTree('/flights', 'USER', undefined, {
    catalogNavigation: { searchHref, onSearchFocus: () => focused++ },
  });
  const links = nodes(tree).filter((node) => node.props?.href === searchHref);
  assert.equal(links.length, 2);
  for (const link of links) {
    let prevented = false;
    link.props.onClick({
      button: 0,
      preventDefault: () => {
        prevented = true;
      },
    });
    assert.equal(prevented, true);
  }
  assert.equal(focused, 2);
  let modifiedPrevented = false;
  links[0].props.onClick({
    button: 0,
    ctrlKey: true,
    preventDefault: () => {
      modifiedPrevented = true;
    },
  });
  assert.equal(modifiedPrevented, false);
  assert.equal(focused, 2);
});

test('admin navigation and guest sign-in routes remain available', () => {
  const admin = hrefs(headerTree('/admin', 'ADMIN').tree);
  for (const target of ['/admin', '/admin/flights', '/admin/bookings'])
    assert.ok(admin.includes(target));
  const guest = hrefs(headerTree('/', null).tree);
  assert.ok(guest.includes('/login'));
  assert.ok(guest.includes('/register'));
});

test('logout returns to login even when server logout rejects', async () => {
  let calls = 0;
  const h = headerTree('/flights', 'USER', async () => {
    calls++;
    throw new Error('offline');
  });
  nodes(h.tree)
    .find((node) => node.props?.variant === 'destructive')
    .props.onClick();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 1);
  assert.deepEqual(h.redirects, ['/login']);
});
