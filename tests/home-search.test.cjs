/* oxlint-disable typescript/no-require-imports -- Node's CommonJS test harness evaluates transpiled TypeScript without an extra runner. */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function loadTs(relative, resolve, globals = {}) {
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
      ...globals,
    },
    { filename },
  );
  return tsModule.exports;
}

const search = loadTs('lib/flight-search.ts', require);
const valid = { from: 'Jakarta', to: 'Denpasar', date: '', airline: '' };

test('blank optional filters do not create empty query parameters', () => {
  assert.equal(search.flightSearchHref({}), '/flights');
  assert.equal(
    search.flightSearchHref(valid),
    '/flights?dari=Jakarta&ke=Denpasar',
  );
});

test('destination shortcuts search the selected city without assuming a departure', () => {
  for (const city of search.flightCities) {
    const params = new URL(
      search.flightSearchHref({ to: city }),
      'http://localhost',
    ).searchParams;
    assert.equal(params.get('ke'), city);
    assert.equal(params.size, 1);
  }
});

test('all four filters round-trip through the existing query contract', () => {
  const url = new URL(
    search.flightSearchHref({
      ...valid,
      date: '2026-09-10',
      airline: 'Garuda Indonesia',
    }),
    'http://localhost',
  );
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    dari: 'Jakarta',
    ke: 'Denpasar',
    tanggal: '2026-09-10',
    maskapai: 'Garuda Indonesia',
  });
});

test('dates use local calendar values rather than UTC day conversion', () => {
  assert.equal(
    search.localDateValue(new Date(2026, 8, 10, 0, 5)),
    '2026-09-10',
  );
  assert.equal(
    search.localDateValue(new Date(2026, 0, 2, 23, 55)),
    '2026-01-02',
  );
});

test('validation allows flexible dates and rejects the same city or a past date', () => {
  assert.equal(search.validateHomeSearch(valid, '2026-09-02'), null);
  assert.equal(
    search.validateHomeSearch({ ...valid, date: '2026-09-02' }, '2026-09-02'),
    null,
  );
  assert.equal(
    search.validateHomeSearch({ ...valid, date: '2026-09-10' }, '2026-09-02'),
    null,
  );
  assert.equal(
    search.validateHomeSearch({ ...valid, to: 'Jakarta' }, '2026-09-02').field,
    'to',
  );
  assert.equal(
    search.validateHomeSearch({ ...valid, date: '2026-09-01' }, '2026-09-02')
      .field,
    'date',
  );
});

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}

// Exercise the component's actual event handlers without a browser or new test dependencies.
function componentHarness() {
  const state = [];
  const destinations = [];
  const focused = [];
  let slot = 0;
  const react = {
    useState(initial) {
      const index = slot++;
      if (!(index in state)) state[index] = initial;
      return [
        state[index],
        (next) => {
          state[index] = typeof next === 'function' ? next(state[index]) : next;
        },
      ];
    },
    useEffect() {},
    useTransition: () => [false, (callback) => callback()],
  };
  const resolve = (name) => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'next/navigation')
      return { useRouter: () => ({ push: (href) => destinations.push(href) }) };
    if (name === '@/lib/flight-search') return search;
    return new Proxy({}, { get: (_, key) => key });
  };
  const { HomeSearch } = loadTs('components/home-search.tsx', resolve, {
    document: { getElementById: (id) => ({ focus: () => focused.push(id) }) },
  });
  function render() {
    slot = 0;
    return HomeSearch();
  }
  const find = (predicate) => nodes(render()).find(predicate);
  const field = (id) => find((node) => node.props?.id === id);
  return { render, find, field, destinations, focused };
}

test('both city selectors include the same complete city list', () => {
  const h = componentHarness();
  const values = (id) =>
    nodes(h.field(id).props.children).map((node) => node.props.value);
  assert.deepEqual(values('home-from'), values('home-to'));
  assert.equal(values('home-from').length, 6);
  assert.ok(values('home-from').includes('Denpasar'));
  assert.ok(values('home-to').includes('Jakarta'));
});

test('swapping cities updates both selectors and submitted route', () => {
  const h = componentHarness();
  h.find(
    (node) =>
      node.props?.['aria-label'] === 'Tukar kota keberangkatan dan tujuan',
  ).props.onClick();
  assert.equal(h.field('home-from').props.value, 'Denpasar');
  assert.equal(h.field('home-to').props.value, 'Jakarta');
  h.render().props.onSubmit({ preventDefault() {} });
  assert.equal(h.destinations[0], '/flights?dari=Denpasar&ke=Jakarta');
});

test('home has no stale default date and preserves a selected airline', () => {
  const h = componentHarness();
  assert.equal(h.field('home-date').props.value, '');
  assert.equal(h.field('home-date').props.required, undefined);
  h.field('home-airline').props.onChange({ target: { value: 'Citilink' } });
  h.render().props.onSubmit({ preventDefault() {} });
  assert.equal(
    new URL(h.destinations[0], 'http://localhost').searchParams.get('maskapai'),
    'Citilink',
  );
});

test('same-city submission focuses its field and announces an error without navigating', () => {
  const h = componentHarness();
  h.field('home-to').props.onChange({ target: { value: 'Jakarta' } });
  h.render().props.onSubmit({ preventDefault() {} });
  assert.equal(h.destinations.length, 0);
  assert.deepEqual(h.focused, ['home-to']);
  assert.equal(h.field('home-to').props['aria-invalid'], true);
  assert.equal(
    h.find((node) => node.props?.role === 'alert').props.id,
    'home-search-error',
  );
});

test('a past date cannot navigate and correcting it clears its error', () => {
  const h = componentHarness();
  h.field('home-date').props.onChange({ target: { value: '2000-01-01' } });
  h.render().props.onSubmit({ preventDefault() {} });
  assert.equal(h.destinations.length, 0);
  assert.deepEqual(h.focused, ['home-date']);
  h.field('home-date').props.onChange({ target: { value: '' } });
  assert.equal(
    h.find((node) => node.props?.role === 'alert'),
    undefined,
  );
  h.render().props.onSubmit({ preventDefault() {} });
  assert.equal(h.destinations.length, 1);
});

test('shared header account destinations match existing user and admin routes', () => {
  for (const [role, target] of [
    ['USER', '/history'],
    ['ADMIN', '/admin'],
    [null, '/login'],
  ]) {
    const resolve = (name) => {
      if (name === 'react') return { useState: () => [false, () => {}] };
      if (name === 'react/jsx-runtime') return require(name);
      if (name === '@/components/auth-provider')
        return {
          useAuth: () => ({
            session: role ? { role, email: 'test@example.com' } : null,
          }),
        };
      if (name === 'next/link') return { __esModule: true, default: 'a' };
      if (name === 'next/navigation')
        return { usePathname: () => '/', useRouter: () => ({}) };
      if (name === '@/lib/utils')
        return { cn: (...values) => values.filter(Boolean).join(' ') };
      return new Proxy({}, { get: (_, key) => key });
    };
    const { SiteHeader } = loadTs('components/site-header.tsx', resolve);
    assert.ok(
      nodes(SiteHeader()).some(
        (node) =>
          (node.props?.href ?? node.props?.render?.props?.href) === target,
      ),
    );
  }
});
