/* oxlint-disable next/no-img-element -- Local WebP assets are pre-sized; the hero uses explicit responsive sources. */
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Compass,
  CreditCard,
  Luggage,
  MapPin,
  Plane,
  Search,
  ShieldCheck,
  Ticket,
  UserRound,
} from 'lucide-react';

import { Brand } from '@/components/brand';
import { SiteHeader } from '@/components/site-header';
import { HomeSearch } from '@/components/home-search';
import { Card, CardContent } from '@/components/ui/card';
import { flightSearchHref } from '@/lib/flight-search';

const destinations = [
  {
    name: 'Bali',
    city: 'Denpasar',
    subtitle: 'Saatnya menikmati sisi tenang.',
    image: '/images/bali.webp',
    alt: 'Tebing hijau dan laut biru di Pantai Kelingking, Nusa Penida',
    tag: 'Pantai & alam',
  },
  {
    name: 'Yogyakarta',
    city: 'Yogyakarta',
    subtitle: 'Selalu punya cerita untuk pulang.',
    image: '/images/yogyakarta.webp',
    alt: 'Kompleks Candi Prambanan di kawasan Yogyakarta',
    tag: 'Budaya & kuliner',
  },
  {
    name: 'Jakarta',
    city: 'Jakarta',
    subtitle: 'Temukan ritme baru di ibu kota.',
    image: '/images/jakarta.webp',
    alt: 'Gedung perkotaan Jakarta dilihat dari kawasan Manggarai',
    tag: 'Jelajah kota',
  },
  {
    name: 'Surabaya',
    city: 'Surabaya',
    subtitle: 'Hangat kotanya, seru ceritanya.',
    image: '/images/surabaya.webp',
    alt: 'Pemandangan kota Surabaya dengan pepohonan di depan',
    tag: 'Kota & sejarah',
  },
];

const benefits = [
  {
    icon: CalendarDays,
    title: 'Jadwal sesuai rencanamu',
    copy: 'Bandingkan rute, waktu, dan maskapai.',
  },
  {
    icon: CreditCard,
    title: 'Pembayaran terintegrasi',
    copy: 'Lanjutkan pembayaran melalui Midtrans.',
  },
  {
    icon: Ticket,
    title: 'Pesanan dalam satu tempat',
    copy: 'Cek status perjalanan dari akunmu.',
  },
];

const steps = [
  {
    icon: Search,
    number: '01',
    title: 'Temukan penerbangan',
    copy: 'Tentukan kota dan tanggal. Pilih jadwal yang paling cocok dengan rencanamu.',
  },
  {
    icon: UserRound,
    number: '02',
    title: 'Lengkapi data, lalu bayar',
    copy: 'Isi data penumpang sesuai identitas dan selesaikan pembayaran pesanan.',
  },
  {
    icon: Luggage,
    number: '03',
    title: 'Pilih kursi, siap berangkat',
    copy: 'Setelah pembayaran berhasil, pilih kursi yang tersedia dan cek detail tiketmu.',
  },
];

const focusLink =
  'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:ring-offset-4 focus-visible:ring-offset-background';
const container = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';

export default function Home() {
  return (
    <div className="tiketkilat-luxe min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main id="konten-utama" tabIndex={-1}>
        <section
          aria-labelledby="hero-title"
          className="luxe-grid relative isolate overflow-hidden border-b border-border bg-background"
        >
          <div className={`${container} py-9 sm:py-12 lg:py-14`}>
            <div className="grid items-center gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.92fr)] lg:gap-14">
              <div>
                <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-primary sm:text-sm">
                  <span className="h-px w-9 bg-primary" aria-hidden="true" />
                  Pilih rute. Siap berangkat.
                </p>
                <h1
                  id="hero-title"
                  className="font-display max-w-2xl text-balance text-[2.75rem] font-normal leading-[1.03] tracking-[-0.025em] text-foreground sm:text-[3.75rem] lg:text-[4.2rem]"
                >
                  Perjalanan yang terasa berkelas,
                  <span className="text-primary"> sejak memilih tujuan.</span>
                </h1>
                <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                  Temukan jadwal, bandingkan pilihan, dan selesaikan pemesanan
                  dalam satu alur yang jelas bersama TiketKilat.
                </p>
                <dl className="mt-8 grid max-w-xl grid-cols-3 gap-4 border-y border-border py-5">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      Pilihan kota
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-foreground sm:text-base">
                      6 tujuan
                    </dd>
                  </div>
                  <div className="border-x border-border px-4">
                    <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      Pemesanan
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-foreground sm:text-base">
                      Satu alur
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      Pembayaran
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-foreground sm:text-base">
                      Terintegrasi
                    </dd>
                  </div>
                </dl>
              </div>

              <figure className="relative overflow-hidden rounded-xl border border-primary/30 bg-muted shadow-[0_32px_90px_rgba(0,0,0,0.38)]">
                <div
                  className="absolute inset-0 z-10 bg-[linear-gradient(180deg,transparent_45%,rgba(4,11,19,0.88)_100%)]"
                  aria-hidden="true"
                />
                <img
                  src="/images/bali-hero.webp"
                  srcSet="/images/bali.webp 640w, /images/bali-hero.webp 1600w"
                  sizes="(min-width: 1024px) 44vw, 100vw"
                  alt="Laut biru dan tebing Pantai Kelingking di Nusa Penida, Bali"
                  width="1600"
                  height="800"
                  fetchPriority="high"
                  className="aspect-[4/3] h-full w-full object-cover object-[center_52%] sm:aspect-[16/10] lg:aspect-[4/3]"
                />
                <figcaption className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 p-5 text-sm text-white">
                  <span className="flex items-center gap-2 font-semibold">
                    <MapPin
                      className="size-4 text-primary"
                      aria-hidden="true"
                    />{' '}
                    Nusa Penida, Bali
                  </span>
                  <Link
                    href={flightSearchHref({ to: 'Denpasar' })}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-2 font-bold text-primary hover:text-white ${focusLink}`}
                  >
                    Lihat rute{' '}
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section
          id="cari-penerbangan"
          aria-labelledby="search-title"
          className={`${container} relative z-20 scroll-mt-40 pt-8 lg:scroll-mt-28`}
        >
          <Card className="gap-0 overflow-visible rounded-xl border border-primary/20 py-0 shadow-[0_22px_70px_-24px_rgba(0,0,0,0.65)] ring-1 ring-white/5">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-5 py-4 sm:px-7">
              <h2
                id="search-title"
                className="flex items-center gap-2.5 text-base font-bold"
              >
                <span className="grid size-9 place-items-center rounded-lg border border-primary/20 bg-accent text-primary">
                  <Plane className="size-4" aria-hidden="true" />
                </span>{' '}
                Tiket pesawat
              </h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground sm:gap-4">
                <span className="flex items-center gap-1.5 font-semibold text-primary">
                  <span
                    className="size-1.5 rounded-full bg-primary"
                    aria-hidden="true"
                  />{' '}
                  Sekali jalan
                </span>
                <span className="h-3 w-px bg-border" aria-hidden="true" />
                <span>1 penumpang</span>
              </div>
            </div>
            <CardContent className="p-5 pb-4 sm:p-7 sm:pb-5">
              <HomeSearch />
            </CardContent>
          </Card>
          <div className="grid gap-5 border-b border-border py-7 sm:grid-cols-3 sm:gap-6 sm:py-8">
            {benefits.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex items-center gap-3.5">
                <Icon
                  className="size-7 shrink-0 text-primary"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-sm font-bold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {copy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="destinasi"
          aria-labelledby="destinations-title"
          className={`${container} scroll-mt-40 py-12 sm:py-16 lg:scroll-mt-24`}
        >
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Sedikit inspirasi untukmu
              </p>
              <h2
                id="destinations-title"
                className="font-display text-3xl font-normal leading-tight tracking-[-0.02em] sm:text-4xl"
              >
                Ke mana kita kali ini?
              </h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Kota yang berbeda, pengalaman yang tak terlupakan.
              </p>
            </div>
            <Link
              href="/flights"
              className={`inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-sm font-bold text-primary transition-colors hover:text-accent-foreground ${focusLink}`}
            >
              Lihat semua penerbangan{' '}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {destinations.map((destination) => (
              <Link
                key={destination.city}
                href={flightSearchHref({ to: destination.city })}
                className={`group block overflow-hidden rounded-lg border border-border bg-card transition-[box-shadow,border-color] duration-200 hover:border-primary/60 hover:shadow-lg hover:shadow-black/20 ${focusLink}`}
                aria-label={`Cari penerbangan ke ${destination.name}`}
              >
                <div className="relative aspect-[1.4] overflow-hidden bg-muted">
                  <img
                    src={destination.image}
                    alt={destination.alt}
                    width="640"
                    height="500"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
                  />
                  <span className="absolute left-3 top-3 rounded-full border border-primary/20 bg-background/90 px-3 py-1.5 text-xs font-semibold text-primary backdrop-blur-sm">
                    {destination.tag}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-2xl font-normal tracking-tight">
                      {destination.name}
                    </h3>
                    <ArrowUpRight
                      className="size-5 text-muted-foreground transition-colors group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {destination.subtitle}
                  </p>
                  <p className="mt-5 flex items-center gap-1.5 border-t border-border pt-4 text-xs font-bold text-primary">
                    Lihat penerbangan{' '}
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="trip-title"
          className={`${container} pb-12 sm:pb-16`}
        >
          <div className="grid overflow-hidden rounded-xl border border-border bg-travel-soft lg:grid-cols-[1.3fr_1fr]">
            <div className="p-6 sm:p-9">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">
                <Compass className="size-4" aria-hidden="true" /> Rencana boleh
                spontan
              </p>
              <h2
                id="trip-title"
                className="font-display max-w-lg text-3xl font-normal leading-tight tracking-[-0.02em] sm:text-4xl"
              >
                Satu langkah lebih dekat
                <br className="hidden sm:block" /> ke liburan berikutnya.
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
                Belum punya tanggal pasti? Jelajahi pilihan rute terlebih
                dahulu, lalu temukan waktu yang pas untuk berangkat.
              </p>
              <Link
                href="/flights"
                className={`mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 ${focusLink}`}
              >
                Jelajahi penerbangan{' '}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="flex flex-col justify-center border-t border-border p-6 sm:p-9 lg:border-l lg:border-t-0">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-card text-primary">
                  <Plane className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-bold">Mulai dari rute ini</h3>
              </div>
              {[
                { from: 'Jakarta', to: 'Denpasar', name: 'Jakarta ke Bali' },
                {
                  from: 'Jakarta',
                  to: 'Yogyakarta',
                  name: 'Jakarta ke Yogyakarta',
                },
                {
                  from: 'Surabaya',
                  to: 'Makassar',
                  name: 'Surabaya ke Makassar',
                },
              ].map((route) => (
                <Link
                  key={route.name}
                  href={flightSearchHref(route)}
                  className={`group flex min-h-14 items-center justify-between gap-3 border-b border-border py-3 text-sm font-semibold last:border-0 hover:text-primary ${focusLink}`}
                >
                  <span>{route.name}</span>
                  <ArrowUpRight
                    className="size-4 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section
          id="cara-pesan"
          aria-labelledby="steps-title"
          className="scroll-mt-36 border-y border-border bg-background py-12 sm:py-16 lg:scroll-mt-20"
        >
          <div className={container}>
            <div className="mb-9 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Mudah dari awal sampai terbang
              </p>
              <h2
                id="steps-title"
                className="font-display text-3xl font-normal leading-tight tracking-[-0.02em] sm:text-4xl"
              >
                Perjalananmu, tanpa langkah yang rumit.
              </h2>
            </div>
            <ol className="grid gap-7 md:grid-cols-3 md:gap-10">
              {steps.map(({ icon: Icon, number, title, copy }) => (
                <li key={number} className="relative">
                  <div className="mb-4 flex items-center gap-4">
                    <span className="grid size-12 place-items-center rounded-xl border border-border bg-card text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-bold tracking-widest text-muted-foreground">
                      {number}
                    </span>
                    <span
                      className="h-px flex-1 bg-border"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-base font-bold">{title}</h3>
                  <p className="mt-2 max-w-sm text-base leading-7 text-muted-foreground">
                    {copy}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          aria-labelledby="help-title"
          className={`${container} py-12 sm:py-16`}
        >
          <div className="grid items-start gap-7 lg:grid-cols-[0.85fr_1.4fr] lg:gap-20">
            <div>
              <span className="mb-4 inline-flex rounded-lg bg-travel-warm p-3 text-primary">
                <Ticket className="size-6" aria-hidden="true" />
              </span>
              <h2
                id="help-title"
                className="font-display text-3xl font-normal leading-tight tracking-[-0.02em]"
              >
                Sebelum kamu berangkat
              </h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Beberapa hal yang perlu kamu tahu agar pemesanan terasa lebih
                mudah.
              </p>
            </div>
            <div className="space-y-5">
              <div className="border-b border-border pb-5">
                <h3 className="flex gap-2 text-sm font-bold">
                  <Check
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />{' '}
                  Perlu akun untuk memesan?
                </h3>
                <p className="mt-2 pl-6 text-base leading-7 text-muted-foreground">
                  Ya. Masuk atau daftar untuk melihat jadwal yang tersedia,
                  melakukan pemesanan, dan mengelola tiketmu. Rute pilihanmu
                  tetap dibawa setelah masuk.
                </p>
              </div>
              <div className="border-b border-border pb-5">
                <h3 className="flex gap-2 text-sm font-bold">
                  <Check
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />{' '}
                  Kapan bisa memilih kursi?
                </h3>
                <p className="mt-2 pl-6 text-base leading-7 text-muted-foreground">
                  Pemilihan kursi tersedia setelah pembayaran berhasil. Pilih
                  dari kursi yang masih kosong melalui detail pesanan.
                </p>
              </div>
              <div>
                <h3 className="flex gap-2 text-sm font-bold">
                  <Check
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />{' '}
                  Di mana melihat status pesanan?
                </h3>
                <p className="mt-2 pl-6 text-base leading-7 text-muted-foreground">
                  Buka menu Pesanan saya setelah masuk untuk memeriksa status
                  pembayaran dan detail penerbangan.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background">
        <div
          className={`${container} flex flex-col justify-between gap-8 py-9 sm:flex-row sm:items-start`}
        >
          <div>
            <Brand />
            <p className="mt-3 max-w-xs text-xs leading-6 text-muted-foreground">
              Setiap perjalanan punya cerita.
              <br />
              Mulai cerita berikutnya bersama TiketKilat.
            </p>
          </div>
          <nav
            aria-label="Navigasi footer"
            className="flex flex-wrap gap-x-8 gap-y-1 text-sm font-semibold"
          >
            <a
              href="#cari-penerbangan"
              className={`inline-flex min-h-11 items-center rounded-lg hover:text-primary ${focusLink}`}
            >
              Cari tiket
            </a>
            <a
              href="#destinasi"
              className={`inline-flex min-h-11 items-center rounded-lg hover:text-primary ${focusLink}`}
            >
              Destinasi
            </a>
            <a
              href="#cara-pesan"
              className={`inline-flex min-h-11 items-center rounded-lg hover:text-primary ${focusLink}`}
            >
              Cara pesan
            </a>
          </nav>
        </div>
        <div
          className={`${container} flex flex-col justify-between gap-3 border-t border-border py-5 text-xs text-muted-foreground sm:flex-row`}
        >
          <p>
            © {new Date().getFullYear()} TiketKilat. Selamat merencanakan
            perjalanan.
          </p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" aria-hidden="true" /> Versi demo ·
            Jadwal dan harga untuk pengujian
          </p>
        </div>
      </footer>
    </div>
  );
}
