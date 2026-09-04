/* oxlint-disable typescript/no-require-imports -- Test the actual TypeScript handlers with the existing isolated Node harness. */
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
const format = loadTs('lib/format.ts');
const plain = (value) => JSON.parse(JSON.stringify(value));
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
function harness(file, exported, props = {}, modules = {}) {
  const slots = [],
    navigations = [],
    focused = [];
  let cursor = 0;
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
    useMemo: (callback) => callback(),
  };
  const Component = loadTs(
    file,
    (name) => {
      if (name in modules) return modules[name];
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return require(name);
      if (name === 'next/navigation')
        return {
          useRouter: () => ({ push: (href) => navigations.push(href) }),
        };
      if (name === '@/lib/flight-search') return search;
      if (name === '@/lib/flight-catalog') return catalog;
      if (name === '@/lib/format') return format;
      if (name === '@/lib/utils')
        return { cn: (...values) => values.filter(Boolean).join(' ') };
      return new Proxy({}, { get: (_, key) => key });
    },
    {
      document: { getElementById: (id) => ({ focus: () => focused.push(id) }) },
    },
  )[exported];
  const render = () => {
    cursor = 0;
    return Component(props);
  };
  const find = (predicate) => nodes(render()).find(predicate);
  return { render, find, navigations, focused };
}
const values = {
  from: 'Jakarta',
  to: 'Denpasar',
  date: '2099-09-10',
  airline: 'Citilink',
};
function picker(mobile = false, overrides = {}) {
  const selected = [];
  const h = harness('components/travel-navigation.tsx', 'DestinationMenu', {
    className: 'nav',
    mobile,
    catalogNavigation: {
      values,
      cities: [...search.flightCities, 'Ambon'],
      onDestinationSelect: (city) => selected.push(city),
      ...overrides,
    },
  });
  return { ...h, selected };
}

test('desktop and mobile destination menus open and dismiss without changing the page', () => {
  for (const mobile of [false, true]) {
    const h = picker(mobile);
    assert.equal(h.render().props.open, false);
    h.render().props.onOpenChange(true);
    assert.equal(h.render().props.open, true);
    h.render().props.onOpenChange(false);
    assert.equal(h.render().props.open, false);
    assert.deepEqual(h.selected, []);
    assert.deepEqual(h.navigations, []);
    assert.ok(h.find((node) => node.type === 'DialogTrigger'));
    assert.ok(!nodes(h.render()).some((node) => node.props?.href));
  }
});

test('choosing a destination applies it in-place and closes the picker without home navigation', () => {
  for (const mobile of [false, true]) {
    const h = picker(mobile);
    h.render().props.onOpenChange(true);
    h.find(
      (node) => node.props?.['aria-label'] === 'Pilih tujuan Yogyakarta',
    ).props.onClick();
    assert.deepEqual(h.selected, ['Yogyakarta']);
    assert.deepEqual(h.navigations, []);
    assert.equal(h.render().props.open, false);
  }
});

test('the origin is disabled and the selected destination is announced', () => {
  const h = picker();
  assert.equal(
    h.find((node) => node.props?.['aria-label'] === 'Pilih tujuan Jakarta')
      .props.disabled,
    true,
  );
  assert.equal(
    h.find(
      (node) => node.props?.['aria-label'] === 'Pilih tujuan Bali (Denpasar)',
    ).props['aria-pressed'],
    true,
  );
  h.render().props.onOpenChange(true);
  h.find(
    (node) => node.props?.['aria-label'] === 'Pilih tujuan Jakarta',
  ).props.onClick();
  assert.equal(h.render().props.open, true);
  assert.equal(h.selected.length, 0);
  assert.ok(h.find((node) => node.props?.role === 'alert'));
});

test('invalid dates stay visible inside the picker and never trigger a hidden search', () => {
  const h = picker(false, { values: { ...values, date: '2000-01-01' } });
  h.render().props.onOpenChange(true);
  h.find(
    (node) => node.props?.['aria-label'] === 'Pilih tujuan Yogyakarta',
  ).props.onClick();
  assert.equal(h.render().props.open, true);
  assert.equal(h.selected.length, 0);
  assert.match(
    h.find((node) => node.props?.role === 'alert').props.children,
    /tanggal hari ini/,
  );
  h.render().props.onOpenChange(false);
  assert.equal(
    h.find((node) => node.props?.role === 'alert'),
    undefined,
  );
});

test('additional backend cities are selectable in the same in-place flow', () => {
  const h = picker();
  h.find(
    (node) =>
      node.type === 'Button' &&
      Array.isArray(node.props.children) &&
      node.props.children[0] === 'Ambon',
  ).props.onClick();
  assert.deepEqual(h.selected, ['Ambon']);
  assert.deepEqual(h.navigations, []);
});

test('destination selection from home opens a real filtered catalog, never a home anchor', () => {
  const h = harness('components/travel-navigation.tsx', 'DestinationMenu', {
    className: 'nav',
  });
  h.find(
    (node) => node.props?.['aria-label'] === 'Pilih tujuan Bali (Denpasar)',
  ).props.onClick();
  assert.deepEqual(h.navigations, ['/flights?ke=Denpasar']);
});

test('booking guide is a dismissible local panel with no navigation actions', () => {
  for (const mobile of [false, true]) {
    const h = harness('components/travel-navigation.tsx', 'BookingGuideMenu', {
      className: 'nav',
      mobile,
    });
    assert.equal(h.render().type, 'Dialog');
    assert.ok(h.find((node) => node.type === 'DialogTitle'));
    assert.ok(h.find((node) => node.type === 'DialogDescription'));
    assert.ok(h.find((node) => node.type === 'DialogClose'));
    assert.equal(
      nodes(h.render()).filter((node) => node.type === 'li').length,
      4,
    );
    assert.ok(
      !nodes(h.render()).some(
        (node) => node.props?.href || node.props?.onClick,
      ),
    );
    assert.deepEqual(h.navigations, []);
  }
});

test('catalog integration retains draft route, airline, date, budget, departure periods, and sort', () => {
  const calls = [];
  let current = { ...values };
  const h = harness(
    'app/flights/page.tsx',
    'FlightsContent',
    {},
    {
      '@/hooks/use-flight-catalog': {
        useFlightCatalog: () => ({
          filters: current,
          applied: values,
          flights: [
            {
              id: 1,
              maskapai: 'Citilink',
              kotaKeberangkatan: 'Jakarta',
              kotaTujuan: 'Denpasar',
              waktuKeberangkatan: '2099-09-10T08:00:00',
              waktuKedatangan: '2099-09-10T10:00:00',
              hargaTiket: 750000,
            },
          ],
          cities: search.flightCities,
          airlines: search.flightAirlines,
          loading: false,
          error: '',
          setFilters: (next) => {
            current = typeof next === 'function' ? next(current) : next;
          },
          search: (next) => calls.push(next),
        }),
      },
    },
  );
  h.find((node) => node.props?.id === 'catalog-budget').props.onChange({
    target: { value: '1000000' },
  });
  h.find((node) => node.props?.id === 'period-morning').props.onCheckedChange(
    true,
  );
  h.find((node) => node.props?.id === 'catalog-airline').props.onChange({
    target: { value: 'Garuda Indonesia' },
  });
  const cheapestButton = () =>
    h.find(
      (node) =>
        node.type === 'Button' &&
        nodes(node).some(
          (child) =>
            Array.isArray(child.props?.children) &&
            child.props.children.includes('Termurah'),
        ),
    );
  assert.equal(cheapestButton().props.disabled, false);
  cheapestButton().props.onClick();
  const shell = h.render();
  assert.equal(shell.type, 'AppShell');
  const before = shell.props.catalogNavigation;
  assert.equal(before.searchHref, search.flightSearchHref(values));
  before.onDestinationSelect('Yogyakarta');
  assert.deepEqual(plain(current), {
    ...values,
    airline: 'Garuda Indonesia',
    to: 'Yogyakarta',
  });
  assert.equal(calls.length, 1);
  assert.strictEqual(calls[0], current);
  assert.equal(
    h.find((node) => node.props?.id === 'catalog-budget').props.value,
    '1000000',
  );
  assert.equal(
    h.find((node) => node.props?.id === 'period-morning').props.checked,
    true,
  );
  assert.equal(
    nodes(h.render()).filter((node) => node.props?.['aria-pressed'] === true)
      .length,
    1,
  );
  assert.equal(cheapestButton().props['aria-pressed'], true);
  h.render().props.catalogNavigation.onSearchFocus();
  assert.deepEqual(h.focused, ['catalog-from']);
});

test('catalog still mounts only behind its existing authentication guard', () => {
  const h = harness('app/flights/page.tsx', 'default');
  assert.equal(h.render().type, 'RouteGuard');
  assert.equal(h.render().props.role, 'USER');
  assert.equal(h.render().props.children.type.name, 'FlightsContent');
});
