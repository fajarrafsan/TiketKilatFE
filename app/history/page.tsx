'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Download,
  History,
  MapPin,
  Plane,
  Search,
} from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { RouteGuard } from '@/components/route-guard';
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from '@/components/state-panels';
import { StatusBadge } from '@/components/status-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiDownload, apiGet } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { BookingHistory } from '@/lib/types';

export default function HistoryPage() {
  return (
    <RouteGuard role="USER">
      <AppShell>
        <HistoryContent />
      </AppShell>
    </RouteGuard>
  );
}

function HistoryContent() {
  const [bookings, setBookings] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet<BookingHistory[]>('/user/riwayat-pemesanan');
      setBookings(data ?? []);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Riwayat belum dapat dimuat.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function downloadTicket(booking: BookingHistory) {
    if (!booking.tiketId) return;
    setDownloading(booking.kodeBooking);
    setActionError('');
    try {
      await apiDownload(
        `/user/${booking.tiketId}/download-tiket-PDF`,
        `e-tiket-${booking.kodeBooking}.pdf`,
      );
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : 'Tiket belum dapat diunduh.',
      );
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="page-eyebrow">
            <History className="size-4" /> Perjalananmu
          </p>
          <h1 className="page-title">Riwayat pesanan</h1>
          <p className="page-description">
            Pantau pembayaran, pilih kursi, dan akses tiket dari seluruh
            pemesananmu.
          </p>
        </div>
        <Link
          href="/flights"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Search className="size-4" /> Cari penerbangan
        </Link>
      </div>

      {actionError && (
        <Alert
          variant="destructive"
          className="legacy-danger-surface mb-6 border p-3"
        >
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <LoadingPanel label="Memuat riwayat pesanan…" />
      ) : error ? (
        <ErrorPanel message={error} onRetry={load} />
      ) : bookings.length === 0 ? (
        <EmptyPanel
          title="Belum ada pesanan"
          description="Penerbangan yang kamu pesan akan muncul di sini."
          action={
            <Link
              href="/flights"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
            >
              Cari penerbangan <ArrowRight className="size-4" />
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const pending = booking.statusPembayaran === 'BELUM_DIBAYAR';
            const paid = booking.statusPembayaran === 'SUDAH_DIBAYAR';
            const nextHref = pending
              ? `/payment/${encodeURIComponent(booking.kodeBooking)}`
              : paid && !booking.nomorKursi
                ? `/seats/${encodeURIComponent(booking.kodeBooking)}`
                : `/payment/${encodeURIComponent(booking.kodeBooking)}`;
            const nextLabel = pending
              ? 'Lanjutkan pembayaran'
              : paid && !booking.nomorKursi
                ? 'Pilih kursi'
                : 'Lihat detail';
            return (
              <Card key={booking.kodeBooking} className="premium-card">
                <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                          <Plane className="size-5" />
                        </span>
                        <div>
                          <p className="font-extrabold text-foreground">
                            {booking.maskapai}
                          </p>
                          <p className="text-xs font-semibold text-muted-foreground">
                            {booking.kodeBooking}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={booking.statusPembayaran} />
                    </div>
                    <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/45 p-4 sm:grid-cols-3">
                      <div>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="size-3.5" /> Rute
                        </p>
                        <p className="mt-1.5 font-bold text-foreground">
                          {booking.kotaKeberangkatan} → {booking.kotaTujuan}
                        </p>
                      </div>
                      <div>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="size-3.5" /> Keberangkatan
                        </p>
                        <p className="mt-1.5 font-bold text-foreground">
                          {formatDateTime(booking.waktuKeberangkatan)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Kursi</p>
                        <p className="mt-1.5 font-bold text-foreground">
                          {booking.nomorKursi ?? 'Belum dipilih'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch gap-3 border-t border-border pt-5 lg:min-w-56 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <div className="mb-1 lg:text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="mt-1 text-lg font-extrabold text-primary">
                        {formatCurrency(booking.totalHarga)}
                      </p>
                    </div>
                    <Link
                      href={nextHref}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      {nextLabel}
                      <ArrowRight className="size-4" />
                    </Link>
                    {booking.tiketId && paid && booking.nomorKursi && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => downloadTicket(booking)}
                        disabled={downloading === booking.kodeBooking}
                        className="h-11 cursor-pointer rounded-xl"
                      >
                        <Download /> Unduh tiket
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
