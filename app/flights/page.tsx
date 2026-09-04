'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  Filter,
  Info,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { FlightCard } from '@/components/flight-card';
import { RouteGuard } from '@/components/route-guard';
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from '@/components/state-panels';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import { useFlightCatalog } from '@/hooks/use-flight-catalog';
import {
  departurePeriods,
  emptyFlightSearch,
  filterCatalog,
  sortCatalog,
  type CatalogView,
  type FlightSort,
} from '@/lib/flight-catalog';
import {
  flightSearchHref,
  localDateValue,
  validateHomeSearch,
} from '@/lib/flight-search';
import { formatCurrency, formatDate, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';

const container = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';
const selectClass =
  'w-full [&>select]:h-11 [&>select]:cursor-pointer [&>select]:border-0 [&>select]:px-0 [&>select]:pr-6 [&>select]:text-base [&>select]:font-bold [&>svg]:right-0';
const defaultView: CatalogView = {
  sort: 'departure',
  maxPrice: 0,
  periods: [],
};

export default function FlightsPage() {
  return (
    // oxlint-disable-next-line jsx-a11y/aria-role -- RouteGuard's role is application authorization, not a DOM ARIA role.
    <RouteGuard role="USER">
      <FlightsContent />
    </RouteGuard>
  );
}

export function FlightsContent() {
  const {
    filters,
    setFilters,
    applied,
    flights,
    cities,
    airlines,
    loading,
    error,
    search,
  } = useFlightCatalog();
  const [view, setView] = useState<CatalogView>({ ...defaultView });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [validation, setValidation] =
    useState<ReturnType<typeof validateHomeSearch>>(null);
  const narrowed = useMemo(() => filterCatalog(flights, view), [flights, view]);
  const visible = useMemo(
    () => sortCatalog(narrowed, view.sort),
    [narrowed, view.sort],
  );
  const cheapest = sortCatalog(narrowed, 'price')[0];
  const shortest = sortCatalog(narrowed, 'duration')[0];
  const earliest = sortCatalog(narrowed, 'departure')[0];
  const activeFilters = Number(view.maxPrice > 0) + view.periods.length;
  const searchDescription = [
    `${applied.from || 'Semua kota'} → ${applied.to || 'Semua tujuan'}`,
    applied.date ? formatDate(`${applied.date}T00:00:00`) : 'Semua tanggal',
    applied.airline || 'Semua maskapai',
  ].join(' · ');

  function submitSearch(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validateHomeSearch(filters);
    setValidation(problem);
    if (problem) {
      document.getElementById(`catalog-${problem.field}`)?.focus();
      return;
    }
    void search(filters);
  }

  function resetSearch() {
    setFilters({ ...emptyFlightSearch });
    setView({ ...defaultView });
    setValidation(null);
    void search({ ...emptyFlightSearch });
  }

  function resetView() {
    setView((current) => ({ ...current, maxPrice: 0, periods: [] }));
  }

  function selectDestination(city: string) {
    const next = { ...filters, to: city };
    setFilters(next);
    setValidation(null);
    void search(next);
  }

  function focusSearch() {
    document.getElementById('catalog-from')?.focus();
  }

  const sortOptions: {
    value: FlightSort;
    label: string;
    detail: string;
    icon: typeof Plane;
  }[] = [
    {
      value: 'price',
      label: 'Termurah',
      detail: cheapest ? formatCurrency(cheapest.hargaTiket) : '—',
      icon: Sparkles,
    },
    {
      value: 'duration',
      label: 'Tercepat',
      detail: shortest
        ? formatDuration(shortest.waktuKeberangkatan, shortest.waktuKedatangan)
        : '—',
      icon: Clock3,
    },
    {
      value: 'departure',
      label: 'Paling awal',
      detail: earliest
        ? formatDate(earliest.waktuKeberangkatan, {
            day: 'numeric',
            month: 'short',
            year: undefined,
          })
        : '—',
      icon: CalendarDays,
    },
  ];

  return (
    <AppShell
      catalogNavigation={{
        values: filters,
        cities,
        searchHref: flightSearchHref(applied),
        onDestinationSelect: selectDestination,
        onSearchFocus: focusSearch,
      }}
    >
      <div className="pb-12">
        <section className="border-b border-border bg-travel-soft">
          <div className={cn(container, 'pb-8 pt-4 sm:pb-9')}>
            <nav
              aria-label="Breadcrumb"
              className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Link
                href="/"
                className="inline-flex min-h-11 items-center rounded-lg hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                Beranda
              </Link>
              <ChevronRight className="size-3" aria-hidden="true" />
              <span aria-current="page">Penerbangan</span>
            </nav>
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  Pilihan untuk perjalananmu
                </p>
                <h1 className="font-display text-3xl font-normal tracking-[-0.025em] sm:text-4xl">
                  Temukan penerbangan yang pas.
                </h1>
              </div>
              <p className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Plane className="size-4 text-primary" aria-hidden="true" />
                  Sekali jalan
                </span>
                <span className="h-3 w-px bg-input" aria-hidden="true" />
                <span className="flex items-center gap-1.5">
                  <UserRound className="size-4" aria-hidden="true" />1 penumpang
                </span>
              </p>
            </div>

            <Card className="gap-0 overflow-visible rounded-xl border-primary/15 bg-card py-0 shadow-[0_18px_48px_-30px_rgba(0,0,0,0.8)] ring-border">
              <CardContent className="p-5 pb-3 sm:p-6 sm:pb-4">
                <form
                  onSubmit={submitSearch}
                  aria-label="Pencarian penerbangan"
                  aria-busy={loading}
                >
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1.1fr_auto]">
                    <div className="relative min-w-0 rounded-xl border border-input p-3.5 pr-9 focus-within:border-primary md:pr-7">
                      <Label
                        htmlFor="catalog-from"
                        className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
                      >
                        <PlaneTakeoff
                          className="size-4 text-primary"
                          aria-hidden="true"
                        />
                        Dari mana?
                      </Label>
                      <NativeSelect
                        id="catalog-from"
                        name="dari"
                        value={filters.from}
                        onChange={(event) => {
                          setFilters({ ...filters, from: event.target.value });
                          setValidation(null);
                        }}
                        className={selectClass}
                      >
                        <NativeSelectOption value="">
                          Semua kota
                        </NativeSelectOption>
                        {cities.map((city) => (
                          <NativeSelectOption key={city} value={city}>
                            {city}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        onClick={() => {
                          setFilters((current) => ({
                            ...current,
                            from: current.to,
                            to: current.from,
                          }));
                          setValidation(null);
                        }}
                        className="absolute -bottom-7 right-4 z-10 size-11 cursor-pointer rounded-full border-input bg-card text-primary shadow-sm md:-right-7 md:bottom-auto md:top-1/2 md:-translate-y-1/2"
                        aria-label="Tukar kota keberangkatan dan tujuan"
                      >
                        <ArrowLeftRight
                          className="size-4 rotate-90 md:rotate-0"
                          aria-hidden="true"
                        />
                      </Button>
                    </div>
                    <div className="min-w-0 rounded-xl border border-input p-3.5 pr-9 focus-within:border-primary md:pl-7 md:pr-3.5">
                      <Label
                        htmlFor="catalog-to"
                        className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
                      >
                        <PlaneLanding
                          className="size-4 text-primary"
                          aria-hidden="true"
                        />
                        Mau ke mana?
                      </Label>
                      <NativeSelect
                        id="catalog-to"
                        name="ke"
                        value={filters.to}
                        onChange={(event) => {
                          setFilters({ ...filters, to: event.target.value });
                          setValidation(null);
                        }}
                        className={selectClass}
                        aria-invalid={validation?.field === 'to'}
                        aria-describedby={
                          validation?.field === 'to'
                            ? 'catalog-validation'
                            : undefined
                        }
                      >
                        <NativeSelectOption value="">
                          Semua tujuan
                        </NativeSelectOption>
                        {cities.map((city) => (
                          <NativeSelectOption key={city} value={city}>
                            {city}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </div>
                    <div className="min-w-0 rounded-xl border border-input p-3.5 focus-within:border-primary">
                      <Label
                        htmlFor="catalog-date"
                        className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
                      >
                        <CalendarDays
                          className="size-4 text-primary"
                          aria-hidden="true"
                        />
                        Tanggal berangkat
                      </Label>
                      <Input
                        id="catalog-date"
                        name="tanggal"
                        type="date"
                        value={filters.date}
                        onFocus={(event) => {
                          event.currentTarget.min = localDateValue();
                        }}
                        onChange={(event) => {
                          setFilters({ ...filters, date: event.target.value });
                          setValidation(null);
                        }}
                        className="h-11 cursor-pointer border-0 px-0 text-base font-bold md:text-base"
                        aria-invalid={validation?.field === 'date'}
                        aria-describedby={
                          validation?.field === 'date'
                            ? 'catalog-validation'
                            : 'catalog-date-hint'
                        }
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-14 cursor-pointer gap-2 rounded-xl px-7 text-base font-bold md:h-full lg:min-w-48"
                    >
                      {loading ? (
                        <Spinner className="size-5" />
                      ) : (
                        <Search className="size-5" aria-hidden="true" />
                      )}
                      {loading ? 'Mencari…' : 'Cari penerbangan'}
                    </Button>
                  </div>
                  {validation && (
                    <p
                      id="catalog-validation"
                      role="alert"
                      className="mt-3 text-sm font-medium text-destructive"
                    >
                      {validation.message}
                    </p>
                  )}
                  <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <SlidersHorizontal
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Label
                        htmlFor="catalog-airline"
                        className="text-xs text-muted-foreground"
                      >
                        Maskapai
                      </Label>
                      <NativeSelect
                        id="catalog-airline"
                        name="maskapai"
                        value={filters.airline}
                        onChange={(event) =>
                          setFilters({
                            ...filters,
                            airline: event.target.value,
                          })
                        }
                        className="min-w-0 flex-1 sm:w-48 sm:flex-none [&>select]:h-11 [&>select]:cursor-pointer [&>select]:border-0 [&>select]:font-semibold"
                      >
                        <NativeSelectOption value="">
                          Semua maskapai
                        </NativeSelectOption>
                        {airlines.map((airline) => (
                          <NativeSelectOption key={airline} value={airline}>
                            {airline}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </div>
                    <p
                      id="catalog-date-hint"
                      className="text-xs leading-5 text-muted-foreground"
                    >
                      Kosongkan tanggal untuk melihat semua jadwal.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        <section
          className={cn(
            container,
            'grid items-start gap-6 pt-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-7',
          )}
        >
          <aside aria-label="Filter hasil penerbangan" className="space-y-5">
            <Card className="gap-0 rounded-xl py-0 shadow-none ring-border">
              <div className="flex items-center justify-between border-b border-border p-4 lg:p-5">
                <h2 className="hidden items-center gap-2 text-sm font-bold lg:flex">
                  <Filter className="size-4 text-primary" aria-hidden="true" />
                  Filter hasil
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  aria-expanded={filtersOpen}
                  aria-controls="catalog-view-filters"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="h-11 cursor-pointer gap-2 px-0 text-sm font-bold lg:hidden"
                >
                  <Filter className="size-4 text-primary" aria-hidden="true" />
                  Filter hasil
                  {activeFilters > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      {activeFilters}
                    </span>
                  )}
                  <ChevronDown
                    className={cn(
                      'size-4 transition-transform',
                      filtersOpen && 'rotate-180',
                    )}
                    aria-hidden="true"
                  />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetView}
                  disabled={!activeFilters}
                  className="h-11 cursor-pointer px-2 text-xs font-bold text-primary"
                >
                  Reset
                </Button>
              </div>
              <div
                id="catalog-view-filters"
                className={cn(
                  'space-y-6 p-5',
                  !filtersOpen && 'hidden lg:block',
                )}
              >
                <div>
                  <Label
                    htmlFor="catalog-budget"
                    className="mb-3 text-sm font-bold"
                  >
                    Harga maksimum
                  </Label>
                  <NativeSelect
                    id="catalog-budget"
                    value={String(view.maxPrice)}
                    onChange={(event) =>
                      setView({ ...view, maxPrice: Number(event.target.value) })
                    }
                    className="w-full [&>select]:h-11 [&>select]:cursor-pointer [&>select]:bg-card [&>select]:text-sm"
                  >
                    <NativeSelectOption value="0">
                      Semua harga
                    </NativeSelectOption>
                    {[750000, 1000000, 1500000, 2000000].map((price) => (
                      <NativeSelectOption key={price} value={price}>
                        {formatCurrency(price)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Harga tiket untuk satu orang.
                  </p>
                </div>
                <fieldset className="border-t border-border pt-5">
                  <legend className="float-left mb-3 w-full text-sm font-bold">
                    Waktu berangkat
                  </legend>
                  <div className="clear-both space-y-1">
                    {departurePeriods.map((period) => (
                      <label
                        key={period.value}
                        htmlFor={`period-${period.value}`}
                        className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg py-1"
                      >
                        <Checkbox
                          id={`period-${period.value}`}
                          checked={view.periods.includes(period.value)}
                          onCheckedChange={(checked) =>
                            setView((current) => ({
                              ...current,
                              periods: checked
                                ? [...current.periods, period.value]
                                : current.periods.filter(
                                    (value) => value !== period.value,
                                  ),
                            }))
                          }
                          className="size-4.5 cursor-pointer"
                        />
                        <span>
                          <span className="block text-sm font-semibold">
                            {period.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {period.range}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            </Card>
            <div className="hidden rounded-xl border border-primary/10 bg-travel-soft p-5 lg:block">
              <Info className="mb-3 size-5 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-bold">Rencana masih fleksibel?</h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Coba semua tanggal atau maskapai untuk menemukan lebih banyak
                pilihan perjalanan.
              </p>
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                onClick={resetSearch}
                className="mt-3 h-11 cursor-pointer px-0 text-xs font-bold text-primary"
              >
                Lihat semua penerbangan
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <div>
                <h2
                  className="font-display text-2xl font-normal tracking-[-0.015em]"
                  aria-live="polite"
                >
                  {loading
                    ? 'Mencari penerbangan…'
                    : error
                      ? 'Pencarian belum berhasil'
                      : `${visible.length} penerbangan ditemukan`}
                </h2>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {searchDescription}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                onClick={resetSearch}
                className="h-11 w-fit cursor-pointer gap-1.5 px-0 text-xs font-semibold text-primary sm:px-2"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Reset pencarian
              </Button>
            </div>

            <fieldset className="mb-5 grid grid-cols-3 gap-1 rounded-xl border border-border bg-card p-1">
              <legend className="sr-only">Urutkan penerbangan</legend>
              {sortOptions.map(({ value, label, detail, icon: Icon }) => (
                <Button
                  key={value}
                  type="button"
                  variant="ghost"
                  aria-pressed={view.sort === value}
                  disabled={loading || Boolean(error) || !visible.length}
                  onClick={() => setView({ ...view, sort: value })}
                  className={cn(
                    'h-19 min-w-0 cursor-pointer flex-col gap-1 whitespace-normal rounded-lg px-1 sm:px-3',
                    view.sort === value
                      ? 'bg-accent text-primary hover:bg-accent'
                      : 'text-muted-foreground',
                  )}
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold sm:text-sm">
                    <Icon
                      className="hidden size-4 sm:block"
                      aria-hidden="true"
                    />
                    {label}
                  </span>
                  <span className="text-xs font-medium tabular-nums">
                    {loading ? '…' : detail}
                  </span>
                </Button>
              ))}
            </fieldset>
            {activeFilters > 0 && !loading && !error && (
              <p className="mb-4 text-xs text-muted-foreground">
                Menampilkan {visible.length} dari {flights.length} penerbangan
                sesuai filter hasil.
              </p>
            )}

            <div aria-busy={loading}>
              {loading ? (
                <LoadingPanel label="Menyiapkan pilihan penerbanganmu…" />
              ) : error ? (
                <ErrorPanel message={error} onRetry={() => search(applied)} />
              ) : visible.length === 0 ? (
                <div>
                  <EmptyPanel
                    title="Belum ada penerbangan yang cocok"
                    description={
                      flights.length
                        ? 'Coba longgarkan batas harga atau pilih waktu keberangkatan lain.'
                        : 'Coba ubah kota, kosongkan tanggal, atau pilih semua maskapai.'
                    }
                  />
                  <div className="mt-4 text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={flights.length ? resetView : resetSearch}
                      className="h-11 cursor-pointer rounded-lg px-5"
                    >
                      {flights.length
                        ? 'Hapus filter hasil'
                        : 'Lihat semua penerbangan'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {visible.map((flight) => (
                    <FlightCard key={flight.id} flight={flight} />
                  ))}
                </div>
              )}
            </div>

            <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Versi demo TiketKilat. Harga dan jadwal yang ditampilkan merupakan
              data pengujian.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
