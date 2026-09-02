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
  { key: 'totalPenerbangan', label: 'Total penerbangan', icon: PlaneTakeoff, tone: 'bg-blue-50 text-blue-700' },
  { key: 'penerbanganTersedia', label: 'Jadwal tersedia', icon: CalendarCheck2, tone: 'bg-teal-50 text-teal-700' },
  { key: 'totalBooking', label: 'Total booking', icon: UsersRound, tone: 'bg-violet-50 text-violet-700' },
  { key: 'totalTiketTerjual', label: 'Tiket terjual', icon: TicketCheck, tone: 'bg-emerald-50 text-emerald-700' },
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
      setError(caught instanceof Error ? caught.message : 'Statistik belum dapat dimuat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const paymentRate = useMemo(() => {
    if (!stats?.totalBooking) return 0;
    return Math.round((stats.bookingDibayar / stats.totalBooking) * 100);
  }, [stats]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold text-primary">Pusat kendali AstraCom</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-slate-950">Ringkasan operasional</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Pantau jadwal, pemesanan, dan penjualan tiket dari satu tampilan.</p>
        </div>
        <Link href="/admin/flights" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-[#155fc0]">Kelola penerbangan <ArrowRight className="size-4" /></Link>
      </div>

      {loading ? <LoadingPanel label="Menghitung statistik terbaru…" /> : error || !stats ? <ErrorPanel message={error || 'Statistik tidak tersedia.'} onRetry={load} /> : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Statistik utama">
            {statDefinitions.map(({ key, label, icon: Icon, tone }) => (
              <Card key={key} className="gap-0 py-0 shadow-[0_12px_32px_rgba(15,23,42,0.05)] ring-slate-200">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="text-sm font-semibold text-muted-foreground">{label}</p><p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-slate-950">{stats[key].toLocaleString('id-ID')}</p></div>
                    <span className={`grid size-11 place-items-center rounded-xl ${tone}`}><Icon className="size-5" /></span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="gap-0 py-0 ring-slate-200">
              <CardHeader className="border-b p-5 sm:p-6"><CardTitle className="text-lg font-extrabold">Kinerja booking</CardTitle></CardHeader>
              <CardContent className="space-y-6 p-5 sm:p-6">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-4"><p className="text-sm font-bold text-slate-900">Tingkat pembayaran</p><p className="text-lg font-extrabold text-primary">{paymentRate}%</p></div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={paymentRate} aria-valuemin={0} aria-valuemax={100} aria-label="Persentase booking dibayar"><div className="h-full rounded-full bg-[linear-gradient(90deg,#1a73e8,#2a9d8f)] transition-[width] duration-300" style={{ width: `${paymentRate}%` }} /></div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-emerald-50 p-4"><CircleCheckBig className="size-5 text-emerald-700" /><p className="mt-3 text-2xl font-extrabold text-emerald-950">{stats.bookingDibayar}</p><p className="mt-1 text-xs font-semibold text-emerald-800/75">Booking dibayar</p></div>
                  <div className="rounded-xl bg-red-50 p-4"><CircleX className="size-5 text-red-700" /><p className="mt-3 text-2xl font-extrabold text-red-950">{stats.bookingDibatalkan}</p><p className="mt-1 text-xs font-semibold text-red-800/75">Dibatalkan</p></div>
                  <div className="rounded-xl bg-slate-100 p-4"><PlaneLanding className="size-5 text-slate-700" /><p className="mt-3 text-2xl font-extrabold text-slate-950">{stats.penerbanganBerangkat}</p><p className="mt-1 text-xs font-semibold text-slate-600">Sudah berangkat</p></div>
                </div>
              </CardContent>
            </Card>

            <Card className="gap-0 py-0 overflow-hidden ring-slate-200">
              <CardContent className="flex h-full flex-col justify-between bg-[linear-gradient(145deg,#0f5fba,#1a73e8_55%,#168f86_130%)] p-6 text-white sm:p-8">
                <div><span className="grid size-12 place-items-center rounded-2xl bg-white/15"><PlaneTakeoff className="size-6" /></span><h2 className="mt-6 text-2xl font-extrabold tracking-[-0.03em]">Pastikan jadwal selalu akurat</h2><p className="mt-3 text-sm leading-6 text-blue-50/85">Periksa waktu, rute, harga, dan jumlah kursi sebelum menerbitkan penerbangan baru.</p></div>
                <Link href="/admin/flights" className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-primary hover:bg-blue-50">Buka data penerbangan <ArrowRight className="size-4" /></Link>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
