import { CheckCircle2, Plane, ShieldCheck, Sparkles } from 'lucide-react';

import { Brand } from '@/components/brand';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main id="konten-utama" tabIndex={-1} className="grid min-h-screen bg-background lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex flex-col px-4 py-6 sm:px-8 lg:px-12 lg:py-10">
        <Brand />
        <div className="mx-auto flex w-full max-w-md flex-1 items-center py-10">
          {children}
        </div>
        <p className="text-center text-xs text-muted-foreground lg:text-left">© 2026 AstraCom. Perjalananmu, lebih sederhana.</p>
      </section>

      <section className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#0f5fba_0%,#1a73e8_52%,#168f86_120%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 size-[28rem] rounded-full border border-white/10 bg-white/5" />
        <div className="absolute -bottom-48 -left-36 size-[32rem] rounded-full border border-white/10 bg-teal-200/10" />
        <div className="relative mx-auto mt-16 max-w-xl">
          <span className="grid size-14 place-items-center rounded-2xl bg-white/15 shadow-2xl backdrop-blur">
            <Plane className="size-7 -rotate-12" aria-hidden="true" />
          </span>
          <h1 className="mt-8 text-balance text-4xl font-extrabold leading-tight tracking-[-0.04em]">Satu akun untuk seluruh perjalananmu.</h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-blue-50/90">Cari penerbangan, lanjutkan pembayaran, pilih kursi, dan kelola tiket tanpa berpindah tempat.</p>
        </div>
        <div className="relative mx-auto grid w-full max-w-xl gap-3 sm:grid-cols-3">
          {[
            [ShieldCheck, 'Transaksi aman'],
            [Sparkles, 'Harga transparan'],
            [CheckCircle2, 'Alur praktis'],
          ].map(([Icon, label]) => {
            const FeatureIcon = Icon as typeof ShieldCheck;
            return (
              <div key={label as string} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <FeatureIcon className="size-5" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold">{label as string}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
