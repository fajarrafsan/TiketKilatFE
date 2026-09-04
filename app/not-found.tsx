import Link from 'next/link';
import { ArrowLeft, Compass, Plane } from 'lucide-react';

export default function NotFound() {
  return (
    <main
      id="konten-utama"
      tabIndex={-1}
      className="tiketkilat-luxe luxe-grid grid min-h-screen place-items-center bg-[radial-gradient(circle_at_50%_20%,rgba(223,189,118,0.12),transparent_34%),#07111d] px-4 py-12 text-foreground"
    >
      <div className="max-w-lg text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Plane className="size-8 -rotate-12" />
        </span>
        <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.15em] text-primary">
          404 · Rute tidak ditemukan
        </p>
        <h1 className="font-display mt-3 text-5xl font-normal tracking-[-0.025em] text-foreground">
          Halaman ini tidak ada di jadwal
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Tautannya mungkin sudah berubah atau alamat yang kamu masukkan kurang
          tepat.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="size-4" /> Kembali ke beranda
        </Link>
        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Compass className="size-4" /> TiketKilat akan membantumu menemukan
          rute lain.
        </p>
      </div>
    </main>
  );
}
