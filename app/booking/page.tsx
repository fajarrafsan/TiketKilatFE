'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileUp,
  Info,
  Plane,
  ShieldCheck,
  Smartphone,
  UserRound,
} from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { BookingStepper } from '@/components/booking-stepper';
import { RouteGuard } from '@/components/route-guard';
import { ErrorPanel, LoadingPanel } from '@/components/state-panels';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { apiGet, apiPost } from '@/lib/api';
import { formatCurrency, formatDate, formatDuration, formatTime } from '@/lib/format';
import type { BookingCreateResponse, Flight, Seat } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function BookingPage() {
  return (
    <RouteGuard role="USER">
      <AppShell>
        <BookingContent />
      </AppShell>
    </RouteGuard>
  );
}

function BookingContent() {
  const router = useRouter();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [seatLoading, setSeatLoading] = useState(true);
  const [seatError, setSeatError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '' });
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const id = Number(query.get('id'));
    const selectedFlight = {
      id,
      maskapai: query.get('maskapai') ?? '',
      kotaKeberangkatan: query.get('dari') ?? '',
      kotaTujuan: query.get('ke') ?? '',
      waktuKeberangkatan: query.get('berangkat') ?? '',
      waktuKedatangan: query.get('tiba') ?? '',
      hargaTiket: Number(query.get('harga')),
    };
    if (Number.isFinite(id) && id > 0) setFlight(selectedFlight);
  }, []);

  useEffect(() => {
    if (!flight?.id) return;
    setSeatLoading(true);
    apiGet<Seat[]>(`/user/melihat-peta-kursi-penerbangan?penerbanganId=${flight.id}`)
      .then((data) => setSeats(data ?? []))
      .catch((caught) => setSeatError(caught instanceof Error ? caught.message : 'Peta kursi belum dapat dimuat.'))
      .finally(() => setSeatLoading(false));
  }, [flight?.id]);

  const availableSeatCount = useMemo(
    () => seats.filter((seat) => seat.tersedia ?? seat.kursiTersedia ?? false).length,
    [seats],
  );
  const soldOut = !seatLoading && !seatError && seats.length > 0 && availableSeatCount === 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!flight) return;
    if (form.name.trim().length < 2 || form.name.trim().length > 25) {
      setError('Nama penumpang harus terdiri dari 2–25 karakter.');
      return;
    }
    if (!/^08\d{8,13}$/.test(form.phone)) {
      setError('Nomor HP harus diawali 08 dan terdiri dari 10–15 digit.');
      return;
    }
    if (!identityFile) {
      setError('Unggah KTP dalam format JPG, PNG, atau PDF.');
      return;
    }
    if (identityFile.size > 2 * 1024 * 1024) {
      setError('Ukuran file KTP maksimal 2 MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(identityFile.type)) {
      setError('Format KTP harus JPG, PNG, atau PDF.');
      return;
    }

    const body = new FormData();
    body.append('penerbanganId', String(flight.id));
    body.append('nama', form.name.trim());
    body.append('noHP', form.phone);
    body.append('fileKtp', identityFile);

    setSubmitting(true);
    try {
      const booking = await apiPost<BookingCreateResponse>('/user/pemesanan', body);
      window.sessionStorage.setItem(`astracom.booking.${booking.kodeBooking}`, JSON.stringify(booking));
      router.push(`/payment/${encodeURIComponent(booking.kodeBooking)}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Pemesanan belum berhasil.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!flight) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <ErrorPanel message="Detail penerbangan tidak ditemukan. Silakan pilih ulang penerbangan dari halaman pencarian." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Link href="/flights" className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"><ArrowLeft className="size-4" /> Kembali ke hasil pencarian</Link>

      <div className="mb-8 grid gap-6 md:grid-cols-[1fr_360px] md:items-end">
        <div>
          <p className="text-sm font-bold text-primary">Lengkapi data penumpang</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-slate-950">Detail pemesanan</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Pastikan data sesuai identitas. Satu pemesanan berlaku untuk satu penumpang dan satu kursi.</p>
        </div>
        <BookingStepper current={0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="gap-0 py-0 shadow-sm ring-slate-200">
            <CardHeader className="border-b p-5 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg font-extrabold"><UserRound className="size-5 text-primary" /> Data penumpang</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nama lengkap sesuai KTP</Label>
                <Input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Contoh: Budi Santoso" minLength={2} maxLength={25} autoComplete="name" className="h-12 rounded-xl" required />
                <p className="text-xs text-muted-foreground">Nama akan tercetak pada tiket.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor HP aktif</Label>
                <div className="relative">
                  <Smartphone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="phone" inputMode="numeric" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, '') })} placeholder="081234567890" minLength={10} maxLength={15} autoComplete="tel" className="h-12 rounded-xl pl-10" required />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0 shadow-sm ring-slate-200">
            <CardHeader className="border-b p-5 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg font-extrabold"><FileCheck2 className="size-5 text-primary" /> Dokumen identitas</CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <Label htmlFor="identity" className={cn('flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors', identityFile ? 'border-emerald-300 bg-emerald-50' : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50')}>
                <span className={cn('grid size-12 place-items-center rounded-2xl', identityFile ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-primary')}>
                  {identityFile ? <CheckCircle2 className="size-6" /> : <FileUp className="size-6" />}
                </span>
                <span className="mt-4 text-sm font-extrabold text-slate-950">{identityFile ? identityFile.name : 'Unggah foto atau scan KTP'}</span>
                <span className="mt-1 text-xs font-normal leading-5 text-muted-foreground">JPG, PNG, atau PDF · Maksimal 2 MB</span>
              </Label>
              <Input id="identity" type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => setIdentityFile(event.target.files?.[0] ?? null)} className="sr-only" required />
              <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-600" /> Dokumen digunakan untuk verifikasi penumpang dan tersimpan aman di server.</p>
            </CardContent>
          </Card>

          {error && <Alert variant="destructive" className="border-red-200 bg-red-50 p-3"><AlertTitle>Pemesanan belum berhasil</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

          <div className="sticky bottom-20 z-20 rounded-2xl border border-border bg-white/95 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.14)] backdrop-blur md:bottom-4 lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <Button type="submit" disabled={submitting || soldOut} className="h-12 w-full cursor-pointer rounded-xl text-sm font-bold lg:w-auto lg:min-w-56">
              {submitting ? <><Spinner /> Membuat pesanan…</> : 'Lanjut ke pembayaran'}
            </Button>
          </div>
        </form>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="gap-0 py-0 shadow-[0_16px_42px_rgba(15,23,42,0.07)] ring-slate-200">
            <CardHeader className="border-b p-5"><CardTitle className="text-lg font-extrabold">Ringkasan penerbangan</CardTitle></CardHeader>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 border-b border-border pb-5">
                <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-primary"><Plane className="size-5" /></span>
                <div><p className="font-extrabold text-slate-950">{flight.maskapai || 'Penerbangan pilihan'}</p><p className="text-xs text-muted-foreground">{formatDate(flight.waktuKeberangkatan)}</p></div>
              </div>
              <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <div><p className="text-lg font-extrabold">{formatTime(flight.waktuKeberangkatan)}</p><p className="text-xs font-semibold text-muted-foreground">{flight.kotaKeberangkatan || 'Asal'}</p></div>
                <div className="text-center"><p className="mb-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground"><Clock3 className="size-3" /> {formatDuration(flight.waktuKeberangkatan, flight.waktuKedatangan)}</p><div className="h-px bg-slate-300" /><p className="mt-2 text-[10px] font-bold text-teal-700">Langsung</p></div>
                <div className="text-right"><p className="text-lg font-extrabold">{formatTime(flight.waktuKedatangan)}</p><p className="text-xs font-semibold text-muted-foreground">{flight.kotaTujuan || 'Tujuan'}</p></div>
              </div>
              <div className="mt-6 flex items-end justify-between rounded-xl bg-blue-50 p-4"><div><p className="text-xs text-muted-foreground">Total pembayaran</p><p className="mt-1 text-xl font-extrabold text-primary">{formatCurrency(flight.hargaTiket)}</p></div><span className="text-[11px] text-muted-foreground">1 penumpang</span></div>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0 ring-slate-200">
            <CardHeader className="border-b p-5"><CardTitle className="text-base font-extrabold">Pratinjau kursi</CardTitle></CardHeader>
            <CardContent className="p-5">
              {seatLoading ? <LoadingPanel label="Memeriksa kursi…" /> : seatError ? <ErrorPanel message={seatError} /> : (
                <>
                  <div className="mb-4 flex items-center justify-between"><p className="text-sm font-bold text-emerald-700">{availableSeatCount} kursi tersedia</p><p className="text-xs text-muted-foreground">Pilih setelah bayar</p></div>
                  <div className="grid grid-cols-6 gap-2" aria-label="Pratinjau ketersediaan kursi">
                    {seats.slice(0, 24).map((seat) => {
                      const available = seat.tersedia ?? seat.kursiTersedia ?? false;
                      return <span key={seat.id} title={`${seat.nomorKursi}: ${available ? 'tersedia' : 'terisi'}`} className={cn('grid aspect-square place-items-center rounded-md text-[9px] font-bold', available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500 line-through')}>{seat.nomorKursi}</span>;
                    })}
                  </div>
                  <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" /> Ketersediaan dapat berubah hingga pembayaran selesai.</p>
                </>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
