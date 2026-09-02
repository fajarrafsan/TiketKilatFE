import Link from 'next/link';
import { ArrowLeft, Compass, Plane } from 'lucide-react';

export default function NotFound() {
  return (
    <main id="konten-utama" tabIndex={-1} className="grid min-h-screen place-items-center bg-[linear-gradient(145deg,#eef7ff,#f8fbff_55%,#eefaf7)] px-4 py-12">
      <div className="max-w-lg text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-blue-100 text-primary"><Plane className="size-8 -rotate-12" /></span>
        <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.15em] text-primary">404 · Rute tidak ditemukan</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-slate-950">Halaman ini tidak ada di jadwal</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">Tautannya mungkin sudah berubah atau alamat yang kamu masukkan kurang tepat.</p>
        <Link href="/" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-[#155fc0]"><ArrowLeft className="size-4" /> Kembali ke beranda</Link>
        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground"><Compass className="size-4" /> AstraCom akan membantumu menemukan rute lain.</p>
      </div>
    </main>
  );
}
