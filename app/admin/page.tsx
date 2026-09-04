'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarCheck2,
  CircleCheckBig,
  CircleX,
  PlaneLanding,
  PlaneTakeoff,
  TicketCheck,
  UsersRound,
} from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { RouteGuard } from '@/components/route-guard';
import { ErrorPanel, LoadingPanel } from '@/components/state-panels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiGet } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';

const statDefinitions = [
  {
    key: 'totalPenerbangan',
    label: 'Total penerbangan',
    icon: PlaneTakeoff,
    tone: 'border-primary/20 bg-primary/10 text-primary',
  },
  {
    key: 'penerbanganTersedia',
    label: 'Jadwal tersedia',
    icon: CalendarCheck2,
    tone: 'border-teal-400/20 bg-teal-400/10 text-teal-200',
  },
  {
    key: 'totalBooking',
    label: 'Total booking',
    icon: UsersRound,
    tone: 'border-violet-400/20 bg-violet-400/10 text-violet-200',
  },
  {
    key: 'totalTiketTerjual',
    label: 'Tiket terjual',
    icon: TicketCheck,
    tone: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  },
] as const;

export default function AdminDashboardPage() {
  return (
    <RouteGuard role="ADMIN">
      <AppShell>
        <DashboardContent />
      </AppShell>
    </RouteGuard>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setStats(await apiGet<DashboardStats>('/admin/dashboard/stats'));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Statistik belum dapat dimuat.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const paymentRate = useMemo(() => {
    if (!stats?.totalBooking) return 0;
    return Math.round((stats.bookingDibayar / stats.totalBooking) * 100);
  }, [stats]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="page-eyebrow">Pusat kendali TiketKilat</p>
          <h1 className="page-title">Ringkasan operasional</h1>
          <p className="page-description">
            Pantau jadwal, pemesanan, dan penjualan tiket dari satu tampilan.
          </p>
        </div>
        <Link
          href="/admin/flights"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Kelola penerbangan <ArrowRight className="size-4" />
        </Link>
      </div>

      {loading ? (
        <LoadingPanel label="Menghitung statistik terbaru…" />
      ) : error || !stats ? (
        <ErrorPanel
          message={error || 'Statistik tidak tersedia.'}
          onRetry={load}
        />
      ) : (
        <>
          <section
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Statistik utama"
          >
            {statDefinitions.map(({ key, label, icon: Icon, tone }) => (
              <Card key={key} className="premium-card">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-3 text-3xl font-extrabold tabular-nums tracking-[-0.04em] text-foreground">
                        {stats[key].toLocaleString('id-ID')}
                      </p>
                    </div>
                    <span
                      className={`grid size-11 place-items-center rounded-xl border ${tone}`}
                    >
                      <Icon className="size-5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="premium-card">
              <CardHeader className="border-b p-5 sm:p-6">
                <CardTitle className="font-display text-xl font-normal">
                  Kinerja booking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-5 sm:p-6">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-sm font-bold text-foreground">
                      Tingkat pembayaran
                    </p>
                    <p className="text-lg font-extrabold text-primary">
                      {paymentRate}%
                    </p>
                  </div>
                  <div
                    className="h-3 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={paymentRate}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Persentase booking dibayar"
                  >
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#dfbd76,#62c8ba)] transition-[width] duration-300"
                      style={{ width: `${paymentRate}%` }}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                    <CircleCheckBig className="size-5 text-emerald-200" />
                    <p className="mt-3 text-2xl font-extrabold text-emerald-100">
                      {stats.bookingDibayar}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-emerald-100/70">
                      Booking dibayar
                    </p>
                  </div>
                  <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4">
                    <CircleX className="size-5 text-destructive" />
                    <p className="mt-3 text-2xl font-extrabold text-foreground">
                      {stats.bookingDibatalkan}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      Dibatalkan
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/70 p-4">
                    <PlaneLanding className="size-5 text-muted-foreground" />
                    <p className="mt-3 text-2xl font-extrabold text-foreground">
                      {stats.penerbanganBerangkat}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      Sudah berangkat
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gap-0 overflow-hidden border-primary/25 bg-card py-0 ring-primary/20">
              <CardContent className="flex h-full flex-col justify-between bg-[radial-gradient(circle_at_90%_10%,rgba(223,189,118,0.18),transparent_34%),linear-gradient(145deg,#0d1928,#13231f)] p-6 text-foreground sm:p-8">
                <div>
                  <span className="grid size-12 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <PlaneTakeoff className="size-6" />
                  </span>
                  <h2 className="font-display mt-6 text-3xl font-normal tracking-[-0.02em]">
                    Pastikan jadwal selalu akurat
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Periksa waktu, rute, harga, dan jumlah kursi sebelum
                    menerbitkan penerbangan baru.
                  </p>
                </div>
                <Link
                  href="/admin/flights"
                  className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Buka data penerbangan <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
