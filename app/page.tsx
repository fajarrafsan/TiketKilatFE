import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Headphones,
  Plane,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { HomeSearch } from '@/components/home-search';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const trustPoints = [
  { icon: ShieldCheck, title: 'Pembayaran aman', copy: 'Terhubung dengan Midtrans' },
  { icon: Sparkles, title: 'Harga transparan', copy: 'Tanpa biaya tersembunyi' },
  { icon: Headphones, title: 'Bantuan cepat', copy: 'Kami siap menemani perjalananmu' },
];

export default function Home() {
  return (
    <main id="konten-utama" tabIndex={-1} className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
            aria-label="AstraCom, kembali ke beranda"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_22px_rgba(26,115,232,0.22)]">
              <Plane className="size-5 -rotate-12" aria-hidden="true" />
            </span>
            <span className="text-lg font-extrabold tracking-[-0.03em]">
              Astra<span className="text-primary">Com</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-3" aria-label="Navigasi utama">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 sm:px-4"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_8px_24px_rgba(26,115,232,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#155fc0] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
            >
              Daftar
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative isolate border-b border-border/70 bg-[linear-gradient(145deg,#eef7ff_0%,#f8fbff_55%,#eefaf7_100%)] pb-14 pt-12 sm:pb-20 sm:pt-16">
        <div className="pointer-events-none absolute -right-32 -top-32 -z-10 size-[30rem] rounded-full bg-blue-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 -z-10 size-[28rem] rounded-full bg-teal-300/20 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl sm:mb-10">
            <Badge className="mb-4 h-auto bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100">
              <CheckCircle2 data-icon="inline-start" />
              Perjalanan nyaman dimulai di sini
            </Badge>
            <h1 className="max-w-3xl text-balance text-[2.5rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[3.45rem]">
              Temukan penerbangan terbaik, tanpa ribet.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Cari jadwal, pesan tiket, bayar, lalu pilih kursi favoritmu dalam satu alur yang mudah.
            </p>
          </div>

          <Card className="gap-0 overflow-visible rounded-2xl bg-white/95 py-0 shadow-[0_24px_70px_rgba(30,64,175,0.12)] ring-1 ring-slate-200/80">
            <CardContent className="p-4 sm:p-6 lg:p-7">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Sekali jalan</p>
                  <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">Mau terbang ke mana?</h2>
                </div>
                <span className="hidden items-center gap-2 text-xs font-semibold text-muted-foreground sm:flex">
                  <ShieldCheck className="size-4 text-teal-600" aria-hidden="true" />
                  Data kamu terlindungi
                </span>
              </div>

              <HomeSearch />
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {trustPoints.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex items-center gap-3 rounded-xl border border-white/80 bg-white/65 p-3.5 shadow-sm backdrop-blur">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
        <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold text-primary">Pilihan minggu ini</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-slate-950 sm:text-3xl">Rute favorit untukmu</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">Contoh harga untuk satu penumpang. Masuk untuk melihat jadwal dan ketersediaan terbaru.</p>
        </div>

        <Card className="gap-0 py-0 shadow-[0_16px_50px_rgba(15,23,42,0.07)] ring-slate-200">
          <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="grid gap-5 sm:grid-cols-[140px_1fr] sm:items-center">
              <div className="flex items-center gap-3 sm:border-r sm:border-border sm:pr-6">
                <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-primary">
                  <Plane className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-bold text-slate-950">Garuda</p>
                  <p className="text-xs text-muted-foreground">GA 402</p>
                </div>
              </div>

              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-5">
                <div>
                  <p className="text-xl font-extrabold text-slate-950">08.30</p>
                  <p className="text-xs font-semibold text-muted-foreground">Jakarta</p>
                </div>
                <div className="text-center">
                  <p className="mb-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5" aria-hidden="true" />
                    2j 50m
                  </p>
                  <div className="relative h-px bg-slate-300 before:absolute before:-left-0.5 before:-top-1 before:size-2 before:rounded-full before:border-2 before:border-primary before:bg-white after:absolute after:-right-0.5 after:-top-1 after:size-2 after:rounded-full after:bg-primary" />
                  <p className="mt-2 text-[11px] font-semibold text-teal-700">Langsung</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-slate-950">11.20</p>
                  <p className="text-xs font-semibold text-muted-foreground">Denpasar</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-border pt-5 lg:min-w-52 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
              <div>
                <p className="text-xs text-muted-foreground">Mulai dari</p>
                <p className="text-xl font-extrabold text-primary">Rp1.250.000</p>
                <p className="text-[11px] text-muted-foreground">/ orang</p>
              </div>
              <Link href="/login?next=/flights" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-[#155fc0] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35">
                Pilih
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_24px_70px_rgba(30,64,175,0.1)]">
          <img
            src="/og.png"
            alt="Pesawat AstraCom melintasi kepulauan Indonesia"
            width="1200"
            height="630"
            loading="lazy"
            className="h-auto w-full object-cover"
          />
        </div>
      </section>
    </main>
  );
}
