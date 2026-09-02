'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="konten-utama" tabIndex={-1} className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-100 text-red-700"><AlertTriangle className="size-7" /></span>
        <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-slate-950">Ada kendala sementara</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Halaman belum dapat ditampilkan. Coba muat ulang bagian ini.</p>
        <Button onClick={reset} className="mt-6 h-11 cursor-pointer rounded-xl px-5 font-bold"><RotateCcw /> Coba lagi</Button>
      </div>
    </main>
  );
}
