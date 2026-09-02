'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, MapPin, Repeat2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

export function HomeSearch() {
  const router = useRouter();
  const [from, setFrom] = useState('Jakarta');
  const [to, setTo] = useState('Denpasar');
  const [date, setDate] = useState('2026-09-10');
  const [airline, setAirline] = useState('');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new URLSearchParams({ dari: from, ke: to, tanggal: date });
    if (airline) query.set('maskapai', airline);
    router.push(`/flights?${query}`);
  }

  function swapCities() {
    setFrom(to);
    setTo(from);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-[1fr_48px_1fr_0.9fr_0.9fr_auto] lg:items-end">
      <div className="space-y-2">
        <Label htmlFor="from">Dari</Label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
          <NativeSelect id="from" name="dari" value={from} onChange={(event) => setFrom(event.target.value)} className="h-12 w-full rounded-xl pl-10 font-semibold">
            <NativeSelectOption value="Jakarta">Jakarta</NativeSelectOption>
            <NativeSelectOption value="Surabaya">Surabaya</NativeSelectOption>
            <NativeSelectOption value="Yogyakarta">Yogyakarta</NativeSelectOption>
            <NativeSelectOption value="Makassar">Makassar</NativeSelectOption>
          </NativeSelect>
        </div>
      </div>

      <div className="flex items-end justify-center lg:h-12">
        <Button type="button" variant="outline" size="icon-lg" onClick={swapCities} className="size-11 cursor-pointer rounded-full border-blue-200 bg-blue-50 text-primary hover:bg-blue-100" aria-label="Tukar kota keberangkatan dan tujuan">
          <Repeat2 className="size-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="to">Ke</Label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-teal-600" aria-hidden="true" />
          <NativeSelect id="to" name="ke" value={to} onChange={(event) => setTo(event.target.value)} className="h-12 w-full rounded-xl pl-10 font-semibold">
            <NativeSelectOption value="Denpasar">Denpasar</NativeSelectOption>
            <NativeSelectOption value="Makassar">Makassar</NativeSelectOption>
            <NativeSelectOption value="Medan">Medan</NativeSelectOption>
            <NativeSelectOption value="Yogyakarta">Yogyakarta</NativeSelectOption>
          </NativeSelect>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Tanggal terbang</Label>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
          <Input id="date" name="tanggal" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-12 rounded-xl pl-10 font-semibold" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="airline">Maskapai</Label>
        <NativeSelect id="airline" name="maskapai" value={airline} onChange={(event) => setAirline(event.target.value)} className="h-12 w-full rounded-xl font-semibold">
          <NativeSelectOption value="">Semua maskapai</NativeSelectOption>
          <NativeSelectOption value="Garuda Indonesia">Garuda Indonesia</NativeSelectOption>
          <NativeSelectOption value="Batik Air">Batik Air</NativeSelectOption>
          <NativeSelectOption value="Lion Air">Lion Air</NativeSelectOption>
        </NativeSelect>
      </div>

      <Button type="submit" size="lg" className="h-12 cursor-pointer rounded-xl px-6 text-sm font-bold shadow-[0_12px_28px_rgba(26,115,232,0.24)] lg:min-w-36">
        Cari tiket
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
