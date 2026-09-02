'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  Armchair,
  Check,
  CheckCircle2,
  Download,
  Plane,
  TicketCheck,
  X,
} from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { BookingStepper } from '@/components/booking-stepper';
import { RouteGuard } from '@/components/route-guard';
import { ErrorPanel, LoadingPanel } from '@/components/state-panels';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { apiDownload, apiGet, apiPost } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { BookingDetail, Seat } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function SeatsPage() {
  return (
    <RouteGuard role="USER">
      <AppShell>
        <SeatsContent />
      </AppShell>
    </RouteGuard>
  );
}

function SeatsContent() {
  const { code: rawCode } = useParams() as { code: string };
  const code = decodeURIComponent(rawCode);
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const booking = await apiGet<BookingDetail>(`/user/${encodeURIComponent(code)}/detail`);
      setDetail(booking);
      if (booking.statusPembayaran === 'SUDAH_DIBAYAR') {
        const map = await apiGet<Seat[]>(`/user/melihat-peta-kursi?kodeBooking=${encodeURIComponent(code)}`);
        setSeats(map ?? []);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Peta kursi belum dapat dimuat.');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => { void load(); }, [load]);

  const selectedSeat = useMemo(() => seats.find((seat) => seat.id === selectedId), [seats, selectedId]);

  async function chooseSeat() {
    if (!selectedId) return;
    setSaving(true);
    setActionError('');
    try {
      await apiPost(`/user/pemilihan-nomor-kursi?kodeBooking=${encodeURIComponent(code)}&kursiId=${selectedId}`);
      setSuccess(`Kursi ${selectedSeat?.nomorKursi ?? ''} berhasil dipilih.`);
      const booking = await apiGet<BookingDetail>(`/user/${encodeURIComponent(code)}/detail`);
      setDetail(booking);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Kursi belum dapat dipilih.');
    } finally {
      setSaving(false);
    }
  }

  async function downloadTicket() {
    if (!detail?.tiketId) return;
    setDownloading(true);
    setActionError('');
    try {
      await apiDownload(`/user/${detail.tiketId}/download-tiket-PDF`, `e-tiket-${code}.pdf`);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Tiket belum dapat diunduh.');
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8"><LoadingPanel label="Menyiapkan peta kursi…" /></div>;
  if (error || !detail) return <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8"><ErrorPanel message={error || 'Detail booking tidak ditemukan.'} onRetry={load} /></div>;

  if (detail.statusPembayaran !== 'SUDAH_DIBAYAR') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <ErrorPanel message="Pemilihan kursi baru tersedia setelah pembayaran terkonfirmasi." />
        <div className="mt-5 text-center"><Link href={`/payment/${encodeURIComponent(code)}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white">Kembali ke pembayaran <ArrowRight className="size-4" /></Link></div>
      </div>
    );
  }

  const seatAlreadyChosen = Boolean(detail.nomorKursi);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8 grid gap-6 md:grid-cols-[1fr_360px] md:items-end">
        <div>
          <p className="text-sm font-bold text-primary">Kode booking {code}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-slate-950">{seatAlreadyChosen ? 'Kursi sudah dipilih' : 'Pilih kursi favoritmu'}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Setiap booking hanya dapat memilih satu kursi. Kursi yang sudah tersimpan tidak dapat diubah dari halaman ini.</p>
        </div>
        <BookingStepper current={seatAlreadyChosen ? 3 : 2} />
      </div>

      {success && <Alert className="mb-6 border-emerald-200 bg-emerald-50 p-3 text-emerald-800"><CheckCircle2 /><AlertDescription className="text-emerald-800">{success}</AlertDescription></Alert>}
      {actionError && <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 p-3"><AlertDescription>{actionError}</AlertDescription></Alert>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="gap-0 overflow-hidden py-0 shadow-[0_18px_50px_rgba(15,23,42,0.07)] ring-slate-200">
          <CardHeader className="border-b bg-slate-50 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-lg font-extrabold"><Armchair className="size-5 text-primary" /> Kabin pesawat</CardTitle>
              <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-blue-50 ring-1 ring-blue-200" /> Tersedia</span>
                <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-primary" /> Dipilih</span>
                <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-slate-200" /> Terisi</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-8">
            <div className="mx-auto max-w-md rounded-[2.5rem] border-2 border-slate-200 bg-slate-50 px-5 pb-10 pt-6 shadow-inner sm:px-10">
              <div className="mx-auto mb-8 h-12 w-1/2 rounded-t-[100%] border-x-2 border-t-2 border-slate-200 bg-white" aria-hidden="true" />
              <div className="mb-5 grid grid-cols-[1fr_1fr_34px_1fr_1fr] gap-2 text-center text-[10px] font-extrabold text-muted-foreground" aria-hidden="true"><span>A</span><span>B</span><span /><span>C</span><span>D</span></div>
              <div className="grid grid-cols-[1fr_1fr_34px_1fr_1fr] gap-2" role="group" aria-label="Pilih satu kursi">
                {seats.map((seat, index) => {
                  const available = seat.tersedia ?? seat.kursiTersedia ?? false;
                  const selected = seat.id === selectedId;
                  const seatButton = (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={!available || seatAlreadyChosen}
                      onClick={() => setSelectedId(seat.id)}
                      aria-pressed={selected}
                      aria-label={`Kursi ${seat.nomorKursi}, ${available ? selected ? 'dipilih' : 'tersedia' : 'sudah terisi'}`}
                      className={cn('relative grid min-h-12 place-items-center rounded-lg border text-xs font-extrabold transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35', available ? 'cursor-pointer border-blue-200 bg-blue-50 text-blue-800 hover:-translate-y-0.5 hover:bg-blue-100' : 'cursor-not-allowed border-slate-200 bg-slate-200 text-slate-500', selected && 'border-primary bg-primary text-white shadow-[0_8px_18px_rgba(26,115,232,0.25)]')}
                    >
                      {selected ? <Check className="size-4" /> : available ? seat.nomorKursi : <X className="size-4" />}
                    </button>
                  );
                  return (
                    <div key={seat.id} className={cn((index % 4) === 2 && 'col-start-4')}>
                      {seatButton}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="gap-0 py-0 shadow-[0_16px_42px_rgba(15,23,42,0.07)] ring-slate-200">
            <CardHeader className="border-b p-5"><CardTitle className="text-lg font-extrabold">Ringkasan penerbangan</CardTitle></CardHeader>
            <CardContent className="space-y-5 p-5">
              <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-primary"><Plane className="size-5" /></span><div><p className="font-extrabold text-slate-950">{detail.maskapai}</p><p className="text-xs text-muted-foreground">{detail.dari} → {detail.ke}</p></div></div>
              <dl className="space-y-3 border-y border-border py-5 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Berangkat</dt><dd className="text-right font-bold">{formatDateTime(detail.waktuKeberangkatan)}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Penumpang</dt><dd className="text-right font-bold">{detail.namaPenumpang}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Total</dt><dd className="font-bold text-primary">{formatCurrency(detail.totalHarga)}</dd></div>
              </dl>

              <div className="rounded-xl bg-blue-50 p-4 text-center">
                <p className="text-xs font-semibold text-muted-foreground">Kursi pilihan</p>
                <p className="mt-1 text-3xl font-extrabold text-primary">{detail.nomorKursi ?? selectedSeat?.nomorKursi ?? '—'}</p>
              </div>

              {!seatAlreadyChosen ? (
                <Button type="button" onClick={chooseSeat} disabled={!selectedId || saving} className="h-12 w-full cursor-pointer rounded-xl font-bold">
                  {saving ? <><Spinner /> Menyimpan…</> : <><TicketCheck /> Konfirmasi kursi</>}
                </Button>
              ) : detail.tiketId ? (
                <Button type="button" onClick={downloadTicket} disabled={downloading} className="h-12 w-full cursor-pointer rounded-xl font-bold">
                  {downloading ? <><Spinner /> Mengunduh…</> : <><Download /> Unduh e-tiket</>}
                </Button>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">Kursi sudah tersimpan. Tombol unduh akan aktif ketika data e-tiket tersedia dari server.</div>
              )}
            </CardContent>
          </Card>

          <Link href="/history" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-slate-700 hover:bg-muted">Lihat semua pesanan <ArrowRight className="size-4" /></Link>
        </aside>
      </div>
    </div>
  );
}
