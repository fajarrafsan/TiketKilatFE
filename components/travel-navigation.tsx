'use client';

/* oxlint-disable next/no-img-element -- Reuse the local, pre-sized destination WebP assets. */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Compass,
  CreditCard,
  Plane,
  Search,
  Ticket,
  UserRound,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  flightCities,
  flightSearchHref,
  validateHomeSearch,
  type HomeSearchValues,
} from '@/lib/flight-search';
import { cn } from '@/lib/utils';

export interface CatalogNavigation {
  values: HomeSearchValues;
  cities: string[];
  searchHref: string;
  onDestinationSelect: (city: string) => void;
  onSearchFocus: () => void;
}

const featuredDestinations = [
  {
    city: 'Denpasar',
    label: 'Bali',
    description: 'Pantai & alam',
    image: '/images/bali.webp',
  },
  {
    city: 'Yogyakarta',
    label: 'Yogyakarta',
    description: 'Budaya & kuliner',
    image: '/images/yogyakarta.webp',
  },
  {
    city: 'Jakarta',
    label: 'Jakarta',
    description: 'Jelajah ibu kota',
    image: '/images/jakarta.webp',
  },
  {
    city: 'Surabaya',
    label: 'Surabaya',
    description: 'Kota & sejarah',
    image: '/images/surabaya.webp',
  },
];

type MenuProps = { className: string; mobile?: boolean };

function ClosePanel({ label }: { label: string }) {
  return (
    <DialogClose
      render={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 size-11 cursor-pointer rounded-full"
        />
      }
      aria-label={label}
    >
      <X className="size-5" aria-hidden="true" />
    </DialogClose>
  );
}

export function DestinationMenu({
  className,
  mobile = false,
  catalogNavigation,
}: MenuProps & { catalogNavigation?: CatalogNavigation }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const cities = catalogNavigation?.cities ?? flightCities;
  const origin = catalogNavigation?.values.from;
  const selected = catalogNavigation?.values.to;
  const isOrigin = (city: string) =>
    Boolean(origin && city.toLowerCase() === origin.toLowerCase());
  const otherCities = cities.filter(
    (city) =>
      !featuredDestinations.some((destination) => destination.city === city),
  );

  function selectDestination(city: string) {
    const next = {
      from: '',
      date: '',
      airline: '',
      ...catalogNavigation?.values,
      to: city,
    };
    const problem = validateHomeSearch(next);
    if (problem) {
      setError(
        `${problem.message} Tutup pilihan destinasi untuk mengubah pencarian.`,
      );
      return;
    }
    if (catalogNavigation) catalogNavigation.onDestinationSelect(city);
    else router.push(flightSearchHref(next));
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setError('');
      }}
    >
      <DialogTrigger className={cn(className, 'cursor-pointer')}>
        {!mobile && <Compass className="size-4" aria-hidden="true" />}
        Destinasi
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto rounded-xl p-5 shadow-2xl sm:max-w-xl sm:p-7"
      >
        <ClosePanel label="Tutup pilihan destinasi" />
        <DialogHeader className="pr-12">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Mulai dari tujuan
          </span>
          <DialogTitle className="text-2xl font-extrabold leading-tight tracking-tight">
            Mau terbang ke mana?
          </DialogTitle>
          <DialogDescription className="leading-6">
            {catalogNavigation
              ? 'Pilih kota tujuan untuk memperbarui hasil di katalog ini. Tanggal, maskapai, dan filter lainnya tetap tersimpan.'
              : 'Pilih destinasi, lalu bandingkan jadwal penerbangan di katalog.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {featuredDestinations
            .filter(({ city }) => cities.includes(city))
            .map(({ city, label, description, image }) => (
              <button
                key={city}
                type="button"
                disabled={isOrigin(city)}
                aria-label={`Pilih tujuan ${label}${label !== city ? ` (${city})` : ''}`}
                aria-pressed={selected === city}
                onClick={() => selectDestination(city)}
                className={cn(
                  'group overflow-hidden rounded-xl border bg-card text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50',
                  selected === city
                    ? 'border-primary ring-1 ring-primary'
                    : 'cursor-pointer border-border',
                )}
              >
                <img
                  src={image}
                  alt=""
                  width="640"
                  height="480"
                  loading="lazy"
                  className="h-24 w-full object-cover sm:h-28"
                />
                <span className="flex items-center justify-between gap-2 p-3">
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-bold">
                      {label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {isOrigin(city) ? 'Kota keberangkatan' : description}
                    </span>
                  </span>
                  {selected === city ? (
                    <Check
                      className="size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowRight
                      className="size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  )}
                </span>
              </button>
            ))}
        </div>
        {otherCities.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-semibold">Tujuan lainnya</p>
            <div className="flex flex-wrap gap-2">
              {otherCities.map((city) => (
                <Button
                  key={city}
                  type="button"
                  variant="outline"
                  disabled={isOrigin(city)}
                  aria-pressed={selected === city}
                  onClick={() => selectDestination(city)}
                  className={cn(
                    'min-h-11 cursor-pointer gap-2 rounded-lg px-4',
                    selected === city &&
                      'border-primary bg-accent text-primary',
                  )}
                >
                  {city}
                  {selected === city && (
                    <Check className="size-4" aria-hidden="true" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 p-3 text-sm leading-6 text-destructive"
          >
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs leading-5 text-muted-foreground">
            {catalogNavigation
              ? 'Hanya kota tujuan yang akan diubah.'
              : 'Ketersediaan jadwal ditampilkan setelah pencarian.'}
          </p>
          <DialogClose
            render={
              <Button
                variant="outline"
                className="h-11 cursor-pointer rounded-lg px-4"
              />
            }
          >
            Batal
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const bookingSteps = [
  {
    icon: Search,
    title: 'Cari dan pilih penerbangan',
    description:
      'Tentukan rute dan tanggal, bandingkan jadwal serta harga, lalu tekan Pilih tiket.',
  },
  {
    icon: UserRound,
    title: 'Lengkapi data penumpang',
    description:
      'Isi data sesuai identitas. Periksa kembali detail penerbangan sebelum membuat pesanan.',
  },
  {
    icon: CreditCard,
    title: 'Selesaikan pembayaran',
    description:
      'Lanjutkan pembayaran melalui Midtrans sebelum batas waktu pesanan berakhir.',
  },
  {
    icon: Plane,
    title: 'Pilih kursi dan cek tiket',
    description:
      'Setelah pembayaran berhasil, pilih kursi yang tersedia. Detail perjalanan dapat dilihat di menu Akun → Pesanan saya.',
  },
];

export function BookingGuideMenu({ className, mobile = false }: MenuProps) {
  return (
    <Dialog>
      <DialogTrigger className={cn(className, 'cursor-pointer')}>
        {!mobile && <Ticket className="size-4" aria-hidden="true" />}
        Cara pesan
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] gap-6 overflow-y-auto rounded-xl p-5 shadow-2xl sm:max-w-xl sm:p-7"
      >
        <ClosePanel label="Tutup panduan pemesanan" />
        <DialogHeader className="pr-12">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Panduan singkat
          </span>
          <DialogTitle className="text-2xl font-extrabold leading-tight tracking-tight">
            Dari cari tiket sampai siap terbang.
          </DialogTitle>
          <DialogDescription className="leading-6">
            Ikuti langkah berikut. Kamu bisa menutup panduan kapan saja tanpa
            kehilangan halaman yang sedang dibuka.
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-5">
          {bookingSteps.map(({ icon: Icon, title, description }, index) => (
            <li key={title} className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="pt-0.5">
                <h3 className="text-sm font-bold leading-6">
                  <span className="mr-2 text-primary">{index + 1}.</span>
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="border-t border-border pt-4">
          <DialogClose
            render={
              <Button className="h-12 w-full cursor-pointer gap-2 rounded-xl font-bold" />
            }
          >
            Mengerti, lanjutkan
            <ArrowRight className="size-4" aria-hidden="true" />
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
