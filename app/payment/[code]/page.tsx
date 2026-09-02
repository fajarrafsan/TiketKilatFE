'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  Info,
  Plane,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { BookingStepper } from '@/components/booking-stepper';
import { RouteGuard } from '@/components/route-guard';
import { ErrorPanel, LoadingPanel } from '@/components/state-panels';
import { StatusBadge } from '@/components/status-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { apiGet, apiPost } from '@/lib/api';
import { countdownLabel, formatCurrency, formatDateTime } from '@/lib/format';
import type { BookingCreateResponse, BookingDetail } from '@/lib/types';

export default function PaymentPage() {
  return (
    <RouteGuard role="USER">
      <AppShell>
        <PaymentContent />
      </AppShell>
    </RouteGuard>
  );
}

function PaymentContent() {
  const { code: rawCode } = useParams() as { code: string };
  const code = decodeURIComponent(rawCode);
  const router = useRouter();
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [payment, setPayment] = useState<BookingCreateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [remaining, setRemaining] = useState(0);

  const loadDetail = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const data = await apiGet<BookingDetail>(`/user/${encodeURIComponent(code)}/detail`);
      setDetail(data);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Detail pembayaran belum dapat dimuat.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [code]);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(`astracom.booking.${code}`);
    if (stored) {
      try { setPayment(JSON.parse(stored) as BookingCreateResponse); } catch { /* Ignore malformed local data. */ }
    }
    void loadDetail(true);
    const polling = window.setInterval(() => void loadDetail(true), 4_000);
    return () => window.clearInterval(polling);
  }, [code, loadDetail]);

  useEffect(() => {
    const tick = () => {
      if (!detail?.batasWaktuPembayaran) return setRemaining(0);
      setRemaining(Math.max(0, new Date(detail.batasWaktuPembayaran).getTime() - Date.now()));
    };
    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, [detail?.batasWaktuPembayaran]);

  async function cancelBooking() {
    setCanceling(true);
    setActionError('');
    try {
      await apiPost(`/user/${encodeURIComponent(code)}/batalkan`);
      await loadDetail(true);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Pesanan belum dapat dibatalkan.');
    } finally {
      setCanceling(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8"><LoadingPanel label="Memeriksa status pembayaran…" /></div>;
  }

  if (error && !detail) {
    return <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8"><ErrorPanel message={error} onRetry={() => loadDetail()} /></div>;
  }

  if (!detail) return null;

  const paid = detail.statusPembayaran === 'SUDAH_DIBAYAR';
  const canceled = detail.statusPembayaran === 'CANCEL';
  const expired = !paid && !canceled && Boolean(detail.batasWaktuPembayaran) && remaining <= 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8 grid gap-6 md:grid-cols-[1fr_360px] md:items-end">
        <div>
          <p className="text-sm font-bold text-primary">Kode booking {code}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-slate-950">{paid ? 'Pembayaran berhasil' : canceled ? 'Pesanan dibatalkan' : 'Selesaikan pembayaran'}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Status diperbarui otomatis setiap 4 detik setelah pembayaran diproses oleh Midtrans.</p>
        </div>
        <BookingStepper current={paid ? 2 : 1} />
      </div>

      {actionError && <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 p-3"><AlertDescription>{actionError}</AlertDescription></Alert>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          {paid ? (
            <Card className="gap-0 overflow-hidden py-0 ring-emerald-200">
              <CardContent className="bg-[linear-gradient(145deg,#ecfdf5,#f0fdfa)] p-6 sm:p-8">
                <span className="grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 className="size-7" /></span>
                <h2 className="mt-5 text-2xl font-extrabold tracking-[-0.03em] text-emerald-950">Pembayaranmu sudah terkonfirmasi</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-900/75">Selanjutnya pilih satu kursi yang tersedia agar tiket dapat diterbitkan.</p>
                <Button onClick={() => router.push(`/seats/${encodeURIComponent(code)}`)} className="mt-6 h-12 cursor-pointer rounded-xl px-6 font-bold">
                  Pilih kursi sekarang
                  <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ) : canceled || expired ? (
            <Card className="gap-0 overflow-hidden py-0 ring-red-200">
              <CardContent className="bg-red-50 p-6 sm:p-8">
                <span className="grid size-14 place-items-center rounded-2xl bg-red-100 text-red-700"><XCircle className="size-7" /></span>
                <h2 className="mt-5 text-2xl font-extrabold tracking-[-0.03em] text-red-950">{canceled ? 'Pesanan ini telah dibatalkan' : 'Waktu pembayaran telah berakhir'}</h2>
                <p className="mt-2 text-sm leading-6 text-red-900/75">Kursi tidak lagi ditahan. Silakan cari penerbangan baru untuk membuat pemesanan berikutnya.</p>
                <Link href="/flights" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-[#155fc0]">Cari penerbangan baru <ArrowRight className="size-4" /></Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="gap-0 overflow-hidden py-0 ring-amber-200">
              <CardContent className="bg-[linear-gradient(145deg,#fffbeb,#fff7ed)] p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.13em] text-amber-700"><Clock3 className="size-4" /> Sisa waktu pembayaran</p>
                    <p className="mt-3 font-mono text-5xl font-extrabold tracking-tight text-amber-950" aria-live="polite">{countdownLabel(remaining)}</p>
                    <p className="mt-3 text-sm text-amber-900/75">Batas: {formatDateTime(detail.batasWaktuPembayaran)}</p>
                  </div>
                  <StatusBadge status={detail.statusPembayaran} className="self-start" />
                </div>

                {payment?.redirectUrl ? (
                  <Button type="button" onClick={() => window.open(payment.redirectUrl, '_blank', 'noopener,noreferrer')} className="mt-7 h-12 w-full cursor-pointer rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-700 sm:w-auto sm:min-w-56">
                    Bayar dengan Midtrans
                    <ExternalLink className="size-4" />
                  </Button>
                ) : (
                  <Alert className="mt-7 border-amber-200 bg-white/70 p-3 text-amber-900">
                    <Info />
                    <AlertDescription className="text-amber-900/80">Tautan pembayaran hanya tersedia pada perangkat tempat pesanan dibuat. Jika tautan hilang setelah memuat ulang, buat pemesanan baru atau buka tautan Midtrans yang sebelumnya sudah terbuka.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="gap-0 py-0 shadow-sm ring-slate-200">
            <CardHeader className="border-b p-5 sm:p-6"><CardTitle className="flex items-center gap-2 text-lg font-extrabold"><CreditCard className="size-5 text-primary" /> Status transaksi</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-muted p-4"><div><p className="text-xs text-muted-foreground">Status saat ini</p><p className="mt-1 font-bold text-slate-950">{paid ? 'Pembayaran diterima' : canceled ? 'Dibatalkan' : 'Menunggu pembayaran'}</p></div><StatusBadge status={detail.statusPembayaran} /></div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => loadDetail()} disabled={refreshing} className="h-11 cursor-pointer rounded-xl"><RefreshCw className={refreshing ? 'animate-spin' : ''} /> Periksa sekarang</Button>
                {!paid && !canceled && (
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button type="button" variant="destructive" className="h-11 cursor-pointer rounded-xl" />}>
                      Batalkan pesanan
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogMedia className="bg-red-100 text-red-700"><XCircle /></AlertDialogMedia>
                        <AlertDialogTitle>Batalkan pesanan?</AlertDialogTitle>
                        <AlertDialogDescription>Kursi akan dilepas dan pesanan tidak dapat dilanjutkan. Tindakan ini hanya tersedia sebelum pembayaran.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Tetap lanjutkan</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" disabled={canceling} onClick={cancelBooking}>{canceling ? <><Spinner /> Membatalkan…</> : 'Ya, batalkan'}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="gap-0 py-0 shadow-[0_16px_42px_rgba(15,23,42,0.07)] ring-slate-200">
            <CardHeader className="border-b p-5"><CardTitle className="text-lg font-extrabold">Ringkasan pesanan</CardTitle></CardHeader>
            <CardContent className="space-y-5 p-5">
              <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-primary"><Plane className="size-5" /></span><div><p className="font-extrabold text-slate-950">{detail.maskapai}</p><p className="text-xs text-muted-foreground">{detail.dari ?? detail.kotaKeberangkatan} → {detail.ke ?? detail.kotaTujuan}</p></div></div>
              <dl className="space-y-3 border-y border-border py-5 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Penumpang</dt><dd className="text-right font-bold">{detail.namaPenumpang}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Keberangkatan</dt><dd className="text-right font-bold">{formatDateTime(detail.waktuKeberangkatan)}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Nomor kursi</dt><dd className="font-bold">{detail.nomorKursi ?? 'Belum dipilih'}</dd></div>
              </dl>
              <div className="flex items-end justify-between"><div><p className="text-xs text-muted-foreground">Total pembayaran</p><p className="mt-1 text-xl font-extrabold text-primary">{formatCurrency(detail.totalHarga)}</p></div><ShieldCheck className="size-6 text-teal-600" /></div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
