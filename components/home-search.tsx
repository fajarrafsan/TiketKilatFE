'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftRight,
  CalendarDays,
  PlaneLanding,
  PlaneTakeoff,
  Search,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import {
  flightAirlines,
  flightCities,
  flightSearchHref,
  localDateValue,
  validateHomeSearch,
} from '@/lib/flight-search';

const citySelectClass =
  'w-full [&>select]:h-11 [&>select]:cursor-pointer [&>select]:rounded-sm [&>select]:border-0 [&>select]:px-0 [&>select]:pr-6 [&>select]:text-base [&>select]:font-bold [&>svg]:right-0';

export function HomeSearch() {
  const router = useRouter();
  const [from, setFrom] = useState('Jakarta');
  const [to, setTo] = useState('Denpasar');
  const [date, setDate] = useState('');
  const [airline, setAirline] = useState('');
  const [error, setError] =
    useState<ReturnType<typeof validateHomeSearch>>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = { from, to, date, airline };
    const validation = validateHomeSearch(values);
    setError(validation);
    if (validation) {
      document.getElementById(`home-${validation.field}`)?.focus();
      return;
    }
    startTransition(() => router.push(flightSearchHref(values)));
  }

  return (
    <form
      action="/flights"
      method="get"
      onSubmit={handleSubmit}
      aria-label="Cari tiket pesawat"
      aria-busy={pending}
    >
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.15fr_1.15fr_1fr_0.9fr_auto]">
        <div className="relative min-w-0 rounded-md border border-input bg-card p-3.5 pr-9 transition-colors duration-200 focus-within:border-primary hover:border-primary/70 md:pr-7">
          <Label
            htmlFor="home-from"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
          >
            <PlaneTakeoff className="size-4 text-primary" aria-hidden="true" />{' '}
            Dari mana?
          </Label>
          <NativeSelect
            id="home-from"
            name="dari"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setError(null);
            }}
            className={citySelectClass}
          >
            {flightCities.map((city) => (
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
              setFrom(to);
              setTo(from);
              setError(null);
            }}
            className="absolute -bottom-7 right-4 z-10 size-11 cursor-pointer rounded-full border-input bg-card text-primary shadow-sm hover:bg-accent md:-right-7 md:bottom-auto md:top-1/2 md:-translate-y-1/2"
            aria-label="Tukar kota keberangkatan dan tujuan"
          >
            <ArrowLeftRight
              className="size-4 rotate-90 md:rotate-0"
              aria-hidden="true"
            />
          </Button>
        </div>

        <div className="min-w-0 rounded-md border border-input bg-card p-3.5 pr-9 transition-colors duration-200 focus-within:border-primary hover:border-primary/70 md:pl-7 md:pr-3.5">
          <Label
            htmlFor="home-to"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
          >
            <PlaneLanding className="size-4 text-primary" aria-hidden="true" />{' '}
            Mau ke mana?
          </Label>
          <NativeSelect
            id="home-to"
            name="ke"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setError(null);
            }}
            aria-invalid={error?.field === 'to'}
            aria-describedby={
              error?.field === 'to' ? 'home-search-error' : undefined
            }
            className={citySelectClass}
          >
            {flightCities.map((city) => (
              <NativeSelectOption key={city} value={city}>
                {city === 'Denpasar' ? 'Denpasar, Bali' : city}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="min-w-0 rounded-md border border-input bg-card p-3.5 transition-colors duration-200 focus-within:border-primary hover:border-primary/70">
          <Label
            htmlFor="home-date"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
          >
            <CalendarDays className="size-4 text-primary" aria-hidden="true" />{' '}
            Tanggal berangkat
          </Label>
          <Input
            id="home-date"
            name="tanggal"
            type="date"
            onFocus={(event) => {
              event.currentTarget.min = localDateValue();
            }}
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setError(null);
            }}
            aria-invalid={error?.field === 'date'}
            aria-describedby={
              error?.field === 'date' ? 'home-search-error' : 'home-date-hint'
            }
            className="h-11 cursor-pointer rounded-sm border-0 px-0 text-base font-bold md:text-base"
          />
        </div>

        <div className="min-w-0 rounded-md border border-input bg-card p-3.5 transition-colors duration-200 focus-within:border-primary hover:border-primary/70">
          <Label
            htmlFor="home-airline"
            className="text-sm font-medium text-muted-foreground"
          >
            Maskapai
          </Label>
          <NativeSelect
            id="home-airline"
            name="maskapai"
            value={airline}
            onChange={(event) => setAirline(event.target.value)}
            className="w-full [&>select]:h-11 [&>select]:cursor-pointer [&>select]:rounded-sm [&>select]:border-0 [&>select]:px-0 [&>select]:font-semibold"
          >
            <NativeSelectOption value="">Semua maskapai</NativeSelectOption>
            {flightAirlines.map((name) => (
              <NativeSelectOption key={name} value={name}>
                {name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="h-14 cursor-pointer gap-2 rounded-md px-6 text-base font-bold shadow-lg shadow-primary/10 md:h-full lg:min-w-44"
        >
          {pending ? (
            <Spinner className="size-5" />
          ) : (
            <Search className="size-5" aria-hidden="true" />
          )}
          {pending ? 'Mencari…' : 'Cari penerbangan'}
        </Button>
      </div>

      {error && (
        <p
          id="home-search-error"
          role="alert"
          className="mt-3 text-sm font-medium text-destructive"
        >
          {error.message}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <p
          id="home-date-hint"
          className="text-sm leading-6 text-muted-foreground"
        >
          Tanggal fleksibel? Kosongkan untuk melihat semua jadwal.
        </p>
      </div>
    </form>
  );
}
