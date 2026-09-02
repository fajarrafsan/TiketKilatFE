'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Filter, MapPin, Repeat2, Search, ShieldCheck } from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { FlightCard } from '@/components/flight-card';
import { RouteGuard } from '@/components/route-guard';
import { EmptyPanel, ErrorPanel, LoadingPanel } from '@/components/state-panels';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import { apiGet } from '@/lib/api';
import type { Flight } from '@/lib/types';

interface SearchFilters {
  from: string;
  to: string;
  date: string;
  airline: string;
}

const fallbackCities = ['Jakarta', 'Denpasar', 'Surabaya', 'Yogyakarta', 'Makassar', 'Medan'];

export default function FlightsPage() {
  return (
    <RouteGuard role="USER">
      <AppShell>
        <FlightsContent />
      </AppShell>
    </RouteGuard>
  );
}

function FlightsContent() {
  const [filters, setFilters] = useState<SearchFilters>({ from: '', to: '', date: '', airline: '' });
  const [cities, setCities] = useState<string[]>(fallbackCities);
  const [airlines, setAirlines] = useState<string[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const searchFlights = useCallback(async (nextFilters: SearchFilters, initial = false) => {
    if (initial) setLoading(true);
    else setSearching(true);
    setError('');

    const params = new URLSearchParams();
    if (nextFilters.from) params.set('dari', nextFilters.from);
    if (nextFilters.to) params.set('ke', nextFilters.to);
    if (nextFilters.date) params.set('tanggal', nextFilters.date);
    if (nextFilters.airline) params.set('maskapai', nextFilters.airline);

    try {
      const data = await apiGet<Flight[]>(`/user/melihat-penerbangan-tersedia?${params}`);
      setFlights(data ?? []);
      window.history.replaceState(null, '', `/flights${params.size ? `?${params}` : ''}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Penerbangan belum dapat dimuat.');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const initialFilters = {
      from: query.get('dari') ?? '',
      to: query.get('ke') ?? '',
      date: query.get('tanggal') ?? '',
      airline: query.get('maskapai') ?? '',
    };
    setFilters(initialFilters);

    void Promise.allSettled([
      apiGet<string[]>('/user/daftar-kota').then((data) => data?.length && setCities(data)),
      apiGet<string[]>('/user/daftar-maskapai').then((data) => setAirlines(data ?? [])),
    ]);
    void searchFlights(initialFilters, true);
  }, [searchFlights]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void searchFlights(filters);
  }

  function swapCities() {
    setFilters((current) => ({ ...current, from: current.to, to: current.from }));
  }

  return (
    <div>
      <section className="border-b border-border bg-[linear-gradient(145deg,#eef7ff_0%,#f8fbff_65%,#eefaf7_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold text-primary">Pencarian penerbangan</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-slate-950">Temukan jadwal terbaikmu</h1>
            </div>
            <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><ShieldCheck className="size-4 text-teal-600" /> Harga berasal langsung dari server AstraCom</p>
          </div>

          <Card className="gap-0 overflow-visible rounded-2xl bg-white/95 py-0 shadow-[0_20px_55px_rgba(30,64,175,0.1)] ring-slate-200">
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={submitSearch} className="grid gap-3 lg:grid-cols-[1fr_48px_1fr_0.85fr_0.9fr_auto] lg:items-end">
                <div className="space-y-2">
                  <Label htmlFor="from">Dari</Label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-primary" />
                    <NativeSelect id="from" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} className="h-12 w-full rounded-xl pl-10 font-semibold">
                      <NativeSelectOption value="">Semua kota</NativeSelectOption>
                      {cities.map((city) => <NativeSelectOption key={city} value={city}>{city}</NativeSelectOption>)}
                    </NativeSelect>
                  </div>
                </div>
                <div className="flex items-end justify-center lg:h-12">
                  <Button type="button" variant="outline" size="icon-lg" onClick={swapCities} className="size-11 cursor-pointer rounded-full border-blue-200 bg-blue-50 text-primary" aria-label="Tukar kota asal dan tujuan"><Repeat2 /></Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to">Ke</Label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-teal-600" />
                    <NativeSelect id="to" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} className="h-12 w-full rounded-xl pl-10 font-semibold">
                      <NativeSelectOption value="">Semua kota</NativeSelectOption>
                      {cities.map((city) => <NativeSelectOption key={city} value={city}>{city}</NativeSelectOption>)}
                    </NativeSelect>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal</Label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-primary" />
                    <Input id="date" type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} className="h-12 rounded-xl pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="airline">Maskapai</Label>
                  <NativeSelect id="airline" value={filters.airline} onChange={(event) => setFilters({ ...filters, airline: event.target.value })} className="h-12 w-full rounded-xl font-semibold">
                    <NativeSelectOption value="">Semua maskapai</NativeSelectOption>
                    {airlines.map((airline) => <NativeSelectOption key={airline} value={airline}>{airline}</NativeSelectOption>)}
                  </NativeSelect>
                </div>
                <Button type="submit" disabled={searching} className="h-12 cursor-pointer rounded-xl px-6 font-bold">
                  {searching ? <><Spinner /> Mencari…</> : <><Search /> Cari</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-primary"><Filter className="size-4" /> Hasil pencarian</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-slate-950">{loading ? 'Mencari jadwal…' : `${flights.length} penerbangan ditemukan`}</h2>
          </div>
        </div>

        {loading ? (
          <LoadingPanel label="Mencari penerbangan yang tersedia…" />
        ) : error ? (
          <ErrorPanel message={error} onRetry={() => searchFlights(filters, true)} />
        ) : flights.length === 0 ? (
          <EmptyPanel title="Belum ada penerbangan yang cocok" description="Coba ganti kota, tanggal, atau pilih semua maskapai untuk memperluas pencarian." />
        ) : (
          <div className="space-y-4">
            {flights.map((flight) => <FlightCard key={flight.id} flight={flight} />)}
          </div>
        )}
      </section>
    </div>
  );
}
