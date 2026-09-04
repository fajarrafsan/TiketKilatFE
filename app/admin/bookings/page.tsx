'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CalendarDays,
  CircleX,
  Filter,
  Search,
  TicketCheck,
  UserRound,
} from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { RouteGuard } from '@/components/route-guard';
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from '@/components/state-panels';
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
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiGet, apiPost } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { AdminBookingHistory, PaymentStatus } from '@/lib/types';

export default function AdminBookingsPage() {
  return (
    <RouteGuard role="ADMIN">
      <AppShell>
        <BookingsManagement />
      </AppShell>
    </RouteGuard>
  );
}

function BookingsManagement() {
  const [bookings, setBookings] = useState<AdminBookingHistory[]>([]);
  const [airlines, setAirlines] = useState<string[]>([]);
  const [filters, setFilters] = useState({ airline: '', status: '', date: '' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [canceling, setCanceling] = useState<string | null>(null);

  const load = useCallback(
    async (quiet = false) => {
      if (quiet) setFiltering(true);
      else setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filters.airline) params.set('maskapai', filters.airline);
      if (filters.status) params.set('status', filters.status);
      if (filters.date) params.set('tanggal', filters.date);
      try {
        const data = await apiGet<AdminBookingHistory[]>(
          `/admin/histori-pemesanan${params.size ? `?${params}` : ''}`,
        );
        setBookings(data ?? []);
        setAirlines((current) =>
          Array.from(
            new Set([
              ...current,
              ...(data ?? []).map((booking) => booking.maskapai),
            ]),
          ).sort(),
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Histori booking belum dapat dimuat.',
        );
      } finally {
        setLoading(false);
        setFiltering(false);
      }
    },
    [filters.airline, filters.date, filters.status],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function cancelBooking(code: string) {
    setCanceling(code);
    setError('');
    setFeedback('');
    try {
      await apiPost(`/admin/booking/${encodeURIComponent(code)}/cancel`);
      setFeedback(`Booking ${code} berhasil dibatalkan.`);
      await load(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Booking belum dapat dibatalkan.',
      );
    } finally {
      setCanceling(null);
    }
  }

  const visibleBookings = bookings.filter((booking) => {
    const value = search.toLowerCase();
    return (
      !value ||
      [
        booking.kodeBooking,
        booking.namaPenumpang ?? '',
        booking.emailUser ?? '',
        booking.maskapai,
      ].some((field) => field.toLowerCase().includes(value))
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8">
        <p className="page-eyebrow">
          <TicketCheck className="size-4" /> Aktivitas pemesanan
        </p>
        <h1 className="page-title">Histori booking</h1>
        <p className="page-description">
          Cari pemesanan, pantau status pembayaran, dan batalkan booking yang
          perlu ditindaklanjuti.
        </p>
      </div>

      {feedback && (
        <Alert className="legacy-success-surface mb-6 border p-3">
          <AlertDescription className="text-current">
            {feedback}
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert
          variant="destructive"
          className="legacy-danger-surface mb-6 border p-3"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="premium-card mb-6">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-extrabold text-foreground">
            <Filter className="size-4 text-primary" /> Filter booking
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_0.8fr_0.8fr_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="airline">Maskapai</Label>
              <NativeSelect
                id="airline"
                value={filters.airline}
                onChange={(event) =>
                  setFilters({ ...filters, airline: event.target.value })
                }
                className="h-11 w-full rounded-xl"
              >
                <NativeSelectOption value="">Semua maskapai</NativeSelectOption>
                {airlines.map((airline) => (
                  <NativeSelectOption key={airline} value={airline}>
                    {airline}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status pembayaran</Label>
              <NativeSelect
                id="status"
                value={filters.status}
                onChange={(event) =>
                  setFilters({ ...filters, status: event.target.value })
                }
                className="h-11 w-full rounded-xl"
              >
                <NativeSelectOption value="">Semua status</NativeSelectOption>
                {(
                  [
                    'BELUM_DIBAYAR',
                    'SUDAH_DIBAYAR',
                    'CANCEL',
                  ] as PaymentStatus[]
                ).map((status) => (
                  <NativeSelectOption key={status} value={status}>
                    {status.replaceAll('_', ' ')}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={filters.date}
                  onChange={(event) =>
                    setFilters({ ...filters, date: event.target.value })
                  }
                  className="h-11 rounded-xl pl-10"
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={() => load(true)}
              disabled={filtering}
              className="h-11 cursor-pointer rounded-xl px-5 font-bold"
            >
              {filtering ? (
                <>
                  <Spinner /> Memfilter…
                </>
              ) : (
                'Terapkan'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="premium-card">
        <CardContent className="border-b p-4 sm:p-5">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari kode, nama, atau email…"
              className="h-11 rounded-xl pl-10"
              aria-label="Cari booking"
            />
          </div>
        </CardContent>
        {loading ? (
          <div className="p-5">
            <LoadingPanel label="Memuat histori booking…" />
          </div>
        ) : error && bookings.length === 0 ? (
          <div className="p-5">
            <ErrorPanel message={error} onRetry={() => load()} />
          </div>
        ) : visibleBookings.length === 0 ? (
          <div className="p-5">
            <EmptyPanel
              title="Booking tidak ditemukan"
              description="Ubah pencarian atau filter untuk melihat data lain."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Booking & penumpang</TableHead>
                <TableHead>Penerbangan</TableHead>
                <TableHead>Jadwal</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleBookings.map((booking) => (
                <TableRow key={booking.kodeBooking}>
                  <TableCell className="min-w-52 pl-5">
                    <p className="font-bold text-foreground">
                      {booking.kodeBooking}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <UserRound className="size-3.5" />{' '}
                      {booking.namaPenumpang ??
                        booking.emailUser ??
                        'Penumpang'}
                    </p>
                  </TableCell>
                  <TableCell className="min-w-44">
                    <p className="font-semibold">{booking.maskapai}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {booking.kotaKeberangkatan} → {booking.kotaTujuan}
                    </p>
                  </TableCell>
                  <TableCell className="min-w-40">
                    <p className="font-semibold">
                      {formatDateTime(booking.waktuKeberangkatan)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Booking {formatDateTime(booking.waktuBooking)}
                    </p>
                  </TableCell>
                  <TableCell className="font-bold text-primary">
                    {formatCurrency(booking.totalHarga)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={booking.statusPembayaran} />
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    {booking.statusPembayaran !== 'CANCEL' &&
                    booking.statusPembayaran !== 'SUDAH_DIBAYAR' ? (
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="destructive"
                              size="sm"
                              className="min-h-11 cursor-pointer rounded-lg"
                            />
                          }
                        >
                          <CircleX /> Batalkan
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogMedia className="bg-destructive/15 text-destructive">
                              <CircleX />
                            </AlertDialogMedia>
                            <AlertDialogTitle>
                              Batalkan booking {booking.kodeBooking}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Booking yang sudah dibayar tidak dapat dibatalkan.
                              Pastikan tindakan ini memang diperlukan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Tidak</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              disabled={canceling === booking.kodeBooking}
                              onClick={() => cancelBooking(booking.kodeBooking)}
                            >
                              {canceling === booking.kodeBooking ? (
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
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Tidak ada aksi
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
