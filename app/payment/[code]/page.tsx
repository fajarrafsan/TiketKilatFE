'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
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
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ApiError, apiGet, apiPost } from '@/lib/api';
import { countdownLabel, formatCurrency, formatDateTime } from '@/lib/format';
import { loadMidtransSnap, type MidtransSnap } from '@/lib/midtrans-snap';
import {
  PAYMENT_RETURN_STORAGE_KEY,
  midtransCheckoutUrl,
  midtransOrderId,
  snapResultOrderId,
} from '@/lib/payment-navigation';
import type { BookingCreateResponse, BookingDetail } from '@/lib/types';

export default function PaymentPage() {
  return (
    // oxlint-disable-next-line jsx-a11y/aria-role -- RouteGuard's role is an application authorization role, not an HTML ARIA role.
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
  const [syncError, setSyncError] = useState('');
  const [needsOrderId, setNeedsOrderId] = useState(false);
  const [manualOrderId, setManualOrderId] = useState('');
  const [remaining, setRemaining] = useState(0);
  const [returnedFromMidtrans, setReturnedFromMidtrans] = useState(false);
  const [checkoutPhase, setCheckoutPhase] = useState<
    'idle' | 'loading' | 'open'
  >('idle');
  const checkoutAttempt = useRef(0);
  const checkoutBusy = useRef(false);
  const activeSnap = useRef<MidtransSnap | null>(null);
  const orderHint = useRef<string | null>(null);
  const pageGeneration = useRef(0);
  const statusRequest = useRef<Promise<void> | null>(null);
  const lastStatus = useRef<BookingDetail['statusPembayaran'] | null>(null);

  const closeCheckout = useCallback(() => {
    checkoutAttempt.current += 1;
    checkoutBusy.current = false;
    const snap = activeSnap.current;
    activeSnap.current = null;
    snap?.hide();
  }, []);

  useEffect(() => () => closeCheckout(), [code, closeCheckout]);

  useEffect(() => {
    if (
      checkoutBusy.current &&
      (detail?.statusPembayaran === 'SUDAH_DIBAYAR' ||
        detail?.statusPembayaran === 'CANCEL')
    ) {
      // Close the payment overlay only from the authenticated backend status.
      closeCheckout();
      setCheckoutPhase('idle');
      document.getElementById('payment-status-title')?.focus();
    }
  }, [detail?.statusPembayaran, closeCheckout]);

  const loadDetail = useCallback(
    async (quiet = false, candidate?: unknown): Promise<void> => {
      const generation = pageGeneration.current;
      const hint = midtransOrderId(candidate, code);
      const previousHint = orderHint.current;
      if (hint) orderHint.current = hint;
      if (!quiet) setRefreshing(true);
      while (statusRequest.current) {
        const pending = statusRequest.current;
        await pending;
        if (generation !== pageGeneration.current) return;
        if (!hint || hint === previousHint) {
          setRefreshing(false);
          return;
        }
        // Recheck only when a callback supplies a previously missing legacy ID.
        if (statusRequest.current === pending) statusRequest.current = null;
      }
      if (!quiet) setRefreshing(true);
      const request = (async () => {
        try {
          let data = await apiGet<BookingDetail>(
            `/user/${encodeURIComponent(code)}/detail`,
            { signal: AbortSignal.timeout(12_000) },
          );
          if (generation !== pageGeneration.current) return;
          const id =
            midtransOrderId(data.midtransOrderId, code) ?? orderHint.current;
          setNeedsOrderId(!id && data.statusPembayaran !== 'SUDAH_DIBAYAR');
          if (data.statusPembayaran !== 'SUDAH_DIBAYAR' && (id || !quiet)) {
            try {
              const verified = await apiPost<
                Pick<BookingDetail, 'statusPembayaran' | 'midtransOrderId'>
              >(
                `/user/${encodeURIComponent(code)}/sync-payment`,
                id ? { orderId: id } : {},
                { signal: AbortSignal.timeout(12_000) },
              );
              if (generation !== pageGeneration.current) return;
              data = { ...data, ...verified };
              setNeedsOrderId(!data.midtransOrderId);
              setSyncError('');
            } catch (caught) {
              if (generation !== pageGeneration.current) return;
              setSyncError(
                caught instanceof ApiError && caught.status === 404
                  ? 'Pemeriksaan Midtrans belum tersedia di backend yang berjalan. Restart backend secara manual, lalu tekan Periksa sekarang.'
                  : caught instanceof Error
                    ? caught.message
                    : 'Midtrans belum dapat diperiksa. Jangan bayar ulang; coba Periksa sekarang.',
              );
            }
          } else if (data.statusPembayaran === 'SUDAH_DIBAYAR') {
            setSyncError('');
          }
          if (generation !== pageGeneration.current) return;
          lastStatus.current = data.statusPembayaran;
          setDetail(data);
          setError('');
        } catch (caught) {
          if (generation !== pageGeneration.current) return;
          setError(
            caught instanceof Error
              ? caught.message
              : 'Detail pembayaran belum dapat dimuat.',
          );
        } finally {
          if (generation === pageGeneration.current) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      })();
      statusRequest.current = request;
      await request;
      if (statusRequest.current === request) statusRequest.current = null;
    },
    [code],
  );

  useEffect(() => {
    pageGeneration.current += 1;
    statusRequest.current = null;
    lastStatus.current = null;
    const params = new URLSearchParams(window.location.search);
    const ids = params.getAll('order_id');
    orderHint.current = ids.length === 1 ? midtransOrderId(ids[0], code) : null;
    // oxlint-disable-next-line react/react-compiler -- Hydrate device-local checkout data only after mounting; it is unavailable during server rendering.
    setPayment(null);
    setReturnedFromMidtrans(
      new URLSearchParams(window.location.search).get('from') === 'midtrans',
    );
    try {
      const stored = window.sessionStorage.getItem(`astracom.booking.${code}`);
      if (stored) {
        const saved = JSON.parse(stored) as BookingCreateResponse;
        setPayment(saved);
        orderHint.current ??= midtransOrderId(saved.orderId, code);
      }
    } catch {
      // Still load the booking status when local storage is unavailable or malformed.
    }
    void loadDetail(true);
    const polling = window.setInterval(() => {
      if (lastStatus.current !== 'SUDAH_DIBAYAR') void loadDetail(true);
    }, 8_000);
    return () => {
      pageGeneration.current += 1;
      window.clearInterval(polling);
    };
  }, [code, loadDetail]);

  useEffect(() => {
    const tick = () => {
      if (!detail?.batasWaktuPembayaran) return setRemaining(0);
      setRemaining(
        Math.max(
          0,
          new Date(detail.batasWaktuPembayaran).getTime() - Date.now(),
        ),
      );
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
      setActionError(
        caught instanceof Error
          ? caught.message
          : 'Pesanan belum dapat dibatalkan.',
      );
    } finally {
      setCanceling(false);
    }
  }

  if (loading || (detail && detail.kodeBooking !== code)) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <LoadingPanel label="Memeriksa status pembayaran…" />
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <ErrorPanel message={error} onRetry={() => loadDetail()} />
      </div>
    );
  }

  if (!detail) return null;

  const paid = detail.statusPembayaran === 'SUDAH_DIBAYAR';
  const canceled = detail.statusPembayaran === 'CANCEL';
  const expired =
    !paid &&
    !canceled &&
    Boolean(detail.batasWaktuPembayaran) &&
    remaining <= 0;
  const checkoutUrl = midtransCheckoutUrl(payment?.redirectUrl);

  async function openPayment() {
    if (
      !checkoutUrl ||
      !payment?.snapToken ||
      checkoutBusy.current ||
      paid ||
      canceled ||
      expired
    )
      return;
    checkoutBusy.current = true;
    const attempt = ++checkoutAttempt.current;
    setCheckoutPhase('loading');
    setActionError('');
    try {
      window.sessionStorage.setItem(PAYMENT_RETURN_STORAGE_KEY, code);
    } catch {
      // Standard Snap callbacks stay on this page even without browser storage.
    }
    try {
      const snap = await loadMidtransSnap(checkoutUrl);
      if (attempt !== checkoutAttempt.current) return;
      activeSnap.current = snap;
      setCheckoutPhase('open');

      const finish = (
        outcome: 'success' | 'pending' | 'error' | 'close',
        result?: unknown,
      ) => {
        if (attempt !== checkoutAttempt.current) return;
        // Snap hides its own iframe after invoking a callback. Do not hide it twice.
        checkoutAttempt.current += 1;
        checkoutBusy.current = false;
        activeSnap.current = null;
        setCheckoutPhase('idle');
        if (outcome !== 'close') setReturnedFromMidtrans(true);
        if (outcome === 'error') {
          setActionError(
            'Midtrans belum dapat menyelesaikan pembayaran. Periksa status terlebih dahulu sebelum mencoba lagi.',
          );
        }
        // Callback data is only an order lookup hint; only the backend can confirm payment.
        void loadDetail(false, snapResultOrderId(result, code));
        document.getElementById('payment-status-title')?.focus();
      };
      snap.pay(payment.snapToken, {
        language: 'id',
        uiMode: 'qr',
        // Implement all result callbacks so Snap does not use the dashboard Finish URL.
        onSuccess: (result) => finish('success', result),
        onPending: (result) => finish('pending', result),
        onError: (result) => finish('error', result),
        onClose: () => finish('close'),
      });
    } catch (caught) {
      if (attempt !== checkoutAttempt.current) return;
      closeCheckout();
      setCheckoutPhase('idle');
      setActionError(
        caught instanceof Error
          ? caught.message
          : 'Midtrans belum dapat dibuka. Silakan coba lagi.',
      );
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8 grid gap-6 md:grid-cols-[1fr_360px] md:items-end">
        <div>
          <p className="page-eyebrow">Kode booking {code}</p>
          <h1
            id="payment-status-title"
            tabIndex={-1}
            className="page-title focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
          >
            {paid
              ? 'Pembayaran berhasil'
              : canceled
                ? 'Pesanan dibatalkan'
                : 'Selesaikan pembayaran'}
          </h1>
          <p className="page-description">
            {paid
              ? 'Pembayaran telah diverifikasi oleh backend melalui Midtrans.'
              : 'Status diperiksa otomatis setiap 8 detik. Pembayaran dikonfirmasi langsung ke Midtrans melalui backend.'}
          </p>
        </div>
        <BookingStepper current={paid ? 2 : 1} />
      </div>

      {actionError && (
        <Alert
          variant="destructive"
          className="legacy-danger-surface mb-6 border p-3"
        >
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-6 p-3">
          <AlertDescription>
            Status terbaru belum dapat diperiksa: {error}
          </AlertDescription>
        </Alert>
      )}
      {syncError && !paid && (
        <Alert
          variant="destructive"
          className="legacy-danger-surface mb-6 border p-3"
        >
          <AlertDescription>{syncError}</AlertDescription>
        </Alert>
      )}
      {returnedFromMidtrans && !paid && (
        <Alert className="legacy-info-surface mb-6 border p-4">
          <Info />
          <AlertDescription>
            Kamu sudah kembali dari Midtrans, tetapi pembayaran belum
            terkonfirmasi di TiketKilat. Jika Midtrans sudah menyatakan
            berhasil, jangan bayar ulang atau batalkan pesanan. Tunggu
            konfirmasi dan gunakan Periksa sekarang.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          {paid ? (
            <Card className="gap-0 overflow-hidden border-emerald-400/25 bg-card py-0 ring-emerald-400/25">
              <CardContent className="bg-[radial-gradient(circle_at_90%_10%,rgba(52,211,153,0.14),transparent_34%),linear-gradient(145deg,#0d1928,#10251f)] p-6 sm:p-8">
                <span className="grid size-14 place-items-center rounded-xl bg-emerald-400/15 text-emerald-200">
                  <CheckCircle2 className="size-7" />
                </span>
                <h2 className="font-display mt-5 text-3xl font-normal tracking-[-0.02em] text-emerald-100">
                  Pembayaranmu sudah terkonfirmasi
                </h2>
                <p className="mt-2 max-w-xl text-base leading-7 text-emerald-100/70">
                  Selanjutnya pilih satu kursi yang tersedia agar tiket dapat
                  diterbitkan.
                </p>
                <Button
                  onClick={() =>
                    router.push(`/seats/${encodeURIComponent(code)}`)
                  }
                  className="mt-6 h-12 cursor-pointer rounded-xl px-6 font-bold"
                >
                  Pilih kursi sekarang
                  <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ) : canceled || expired ? (
            <Card className="gap-0 overflow-hidden border-destructive/25 bg-card py-0 ring-destructive/25">
              <CardContent className="bg-[radial-gradient(circle_at_90%_10%,rgba(251,113,133,0.12),transparent_34%),linear-gradient(145deg,#0d1928,#25151b)] p-6 sm:p-8">
                <span className="grid size-14 place-items-center rounded-xl bg-destructive/15 text-destructive">
                  <XCircle className="size-7" />
                </span>
                <h2 className="font-display mt-5 text-3xl font-normal tracking-[-0.02em] text-foreground">
                  {canceled
                    ? 'Pesanan ini telah dibatalkan'
                    : 'Waktu pembayaran telah berakhir'}
                </h2>
                <p className="mt-2 text-base leading-7 text-muted-foreground">
                  Kursi tidak lagi ditahan. Jika belum membayar, kamu bisa
                  mencari penerbangan baru. Jika pembayaran di Midtrans sudah
                  berhasil, jangan bayar ulang; hubungi pengelola dengan kode
                  booking dan bukti pembayaran.
                </p>
                <Link
                  href="/flights"
                  className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Cari penerbangan baru <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="gap-0 overflow-hidden border-primary/25 bg-card py-0 ring-primary/25">
              <CardContent className="bg-[radial-gradient(circle_at_90%_10%,rgba(223,189,118,0.15),transparent_34%),linear-gradient(145deg,#0d1928,#211d17)] p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.13em] text-primary">
                      <Clock3 className="size-4" /> Sisa waktu pembayaran
                    </p>
                    <p
                      className="mt-3 font-mono text-5xl font-extrabold tracking-tight text-foreground"
                      aria-live="polite"
                    >
                      {countdownLabel(remaining)}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Batas: {formatDateTime(detail.batasWaktuPembayaran)}
                    </p>
                  </div>
                  <StatusBadge
                    status={detail.statusPembayaran}
                    className="self-start"
                  />
                </div>

                {checkoutUrl && payment?.snapToken ? (
                  <Button
                    type="button"
                    onClick={openPayment}
                    disabled={checkoutPhase !== 'idle'}
                    aria-haspopup="dialog"
                    aria-busy={checkoutPhase === 'loading'}
                    className="mt-7 h-12 w-full cursor-pointer rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/90 sm:w-auto sm:min-w-56"
                  >
                    {checkoutPhase === 'loading' ? (
                      <>
                        <Spinner className="motion-reduce:animate-none" />{' '}
                        Menyiapkan Midtrans…
                      </>
                    ) : checkoutPhase === 'open' ? (
                      'Pembayaran sedang terbuka'
                    ) : (
                      <>
                        Bayar dengan Midtrans <CreditCard className="size-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Alert className="legacy-warning-surface mt-7 border p-3">
                    <Info />
                    <AlertDescription className="text-current">
                      Tautan pembayaran tidak tersedia. Buka pesanan dari
                      browser dan tab tempat pemesanan dibuat. Jika kamu sudah
                      membayar, jangan buat pembayaran ulang; periksa status
                      atau hubungi pengelola.
                    </AlertDescription>
                  </Alert>
                )}
                {checkoutUrl && (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Midtrans terbuka di dalam halaman ini, tanpa tab baru.
                    Setelah selesai, kamu kembali ke status pesanan.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="premium-card">
            <CardHeader className="border-b p-5 sm:p-6">
              <CardTitle className="font-display flex items-center gap-2 text-xl font-normal">
                <CreditCard className="size-5 text-primary" /> Status transaksi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div
                aria-live="polite"
                className="flex items-center justify-between gap-4 rounded-xl bg-muted p-4"
              >
                <div>
                  <p className="text-xs text-muted-foreground">
                    Status saat ini
                  </p>
                  <p className="mt-1 font-bold text-foreground">
                    {paid
                      ? 'Pembayaran diterima'
                      : canceled
                        ? 'Dibatalkan'
                        : 'Menunggu pembayaran'}
                  </p>
                </div>
                <StatusBadge status={detail.statusPembayaran} />
              </div>
              {needsOrderId && !paid && (
                <form
                  className="legacy-info-surface space-y-3 rounded-xl border p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const id = midtransOrderId(manualOrderId, code);
                    if (!id) {
                      setSyncError(
                        `Gunakan Order ID lengkap untuk ${code}, diikuti tanda - dan 13 angka dari detail transaksi Midtrans.`,
                      );
                      return;
                    }
                    void loadDetail(false, id);
                  }}
                >
                  <label
                    htmlFor="midtrans-order-id"
                    className="text-sm font-bold text-foreground"
                  >
                    Pulihkan status pesanan lama
                  </label>
                  <p
                    id="midtrans-order-help"
                    className="text-sm leading-6 text-muted-foreground"
                  >
                    Order ID pesanan ini belum tersimpan. Salin Order ID lengkap
                    dari detail transaksi Midtrans. Ini hanya memeriksa
                    pembayaran yang sama, bukan membuat pembayaran baru. Jangan
                    masukkan Server Key.
                  </p>
                  <Input
                    id="midtrans-order-id"
                    value={manualOrderId}
                    onChange={(event) => setManualOrderId(event.target.value)}
                    placeholder={`${code}-…`}
                    aria-describedby="midtrans-order-help"
                    autoComplete="off"
                    maxLength={64}
                    className="h-11 bg-card"
                  />
                  <Button
                    type="submit"
                    disabled={refreshing || !manualOrderId.trim()}
                    className="min-h-11 cursor-pointer rounded-xl"
                  >
                    {refreshing ? (
                      <>
                        <Spinner /> Memeriksa Midtrans…
                      </>
                    ) : (
                      'Cocokkan pembayaran'
                    )}
                  </Button>
                </form>
              )}
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadDetail()}
                  disabled={refreshing}
                  className="h-11 cursor-pointer rounded-xl"
                >
                  <RefreshCw
                    className={
                      refreshing
                        ? 'animate-spin motion-reduce:animate-none'
                        : ''
                    }
                  />{' '}
                  {refreshing ? 'Memeriksa Midtrans…' : 'Periksa sekarang'}
                </Button>
                {!paid && !canceled && (
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          type="button"
                          variant="destructive"
                          className="h-11 cursor-pointer rounded-xl"
                        />
                      }
                    >
                      Batalkan pesanan
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogMedia className="bg-destructive/15 text-destructive">
                          <XCircle />
                        </AlertDialogMedia>
                        <AlertDialogTitle>Batalkan pesanan?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Kursi akan dilepas dan pesanan tidak dapat
                          dilanjutkan. Tindakan ini hanya tersedia sebelum
                          pembayaran.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Tetap lanjutkan</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          disabled={canceling}
                          onClick={cancelBooking}
                        >
                          {canceling ? (
                            <>
                              <Spinner /> Membatalkan…
                            </>
                          ) : (
                            'Ya, batalkan'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="premium-card">
            <CardHeader className="border-b p-5">
              <CardTitle className="font-display text-xl font-normal">
                Ringkasan pesanan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Plane className="size-5" />
                </span>
                <div>
                  <p className="font-extrabold text-foreground">
                    {detail.maskapai}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {detail.dari ?? detail.kotaKeberangkatan} →{' '}
                    {detail.ke ?? detail.kotaTujuan}
                  </p>
                </div>
              </div>
              <dl className="space-y-3 border-y border-border py-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Penumpang</dt>
                  <dd className="text-right font-bold">
                    {detail.namaPenumpang}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Keberangkatan</dt>
                  <dd className="text-right font-bold">
                    {formatDateTime(detail.waktuKeberangkatan)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Nomor kursi</dt>
                  <dd className="font-bold">
                    {detail.nomorKursi ?? 'Belum dipilih'}
                  </dd>
                </div>
              </dl>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total pembayaran
                  </p>
                  <p className="mt-1 text-xl font-extrabold text-primary">
                    {formatCurrency(detail.totalHarga)}
                  </p>
                </div>
                <ShieldCheck className="size-6 text-teal-300" />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
