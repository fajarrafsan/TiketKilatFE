'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="konten-utama"
      tabIndex={-1}
      className="tiketkilat-luxe luxe-grid grid min-h-screen place-items-center bg-background px-4 py-12 text-foreground"
    >
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-xl bg-destructive/15 text-destructive">
          <AlertTriangle className="size-7" />
        </span>
        <h1 className="font-display mt-5 text-4xl font-normal tracking-[-0.025em] text-foreground">
          Ada kendala sementara
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Halaman belum dapat ditampilkan. Coba muat ulang bagian ini.
        </p>
        <Button
          onClick={reset}
          className="mt-6 h-11 cursor-pointer rounded-xl px-5 font-bold"
        >
          <RotateCcw /> Coba lagi
        </Button>
      </div>
    </main>
  );
}
