import { CheckCircle2, Plane, ShieldCheck, Sparkles } from 'lucide-react';

import { Brand } from '@/components/brand';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main
      id="konten-utama"
      tabIndex={-1}
      className="tiketkilat-luxe luxe-grid grid min-h-screen bg-background lg:grid-cols-[0.92fr_1.08fr]"
    >
      <section className="flex flex-col border-r border-border/60 px-4 py-6 sm:px-8 lg:px-12 lg:py-10">
        <Brand />
        <div className="mx-auto flex w-full max-w-md flex-1 items-center py-10">
          {children}
        </div>
        <p className="text-center text-xs text-muted-foreground lg:text-left">
          © 2026 TiketKilat. Perjalananmu, lebih sederhana.
        </p>
      </section>

      <section className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_80%_12%,rgba(223,189,118,0.18),transparent_32%),linear-gradient(145deg,#0a1624_0%,#111f2f_55%,#17261f_120%)] p-10 text-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 size-[28rem] rounded-full border border-primary/15 bg-primary/5" />
        <div className="absolute -bottom-48 -left-36 size-[32rem] rounded-full border border-secondary-foreground/10 bg-secondary/20" />
        <div className="relative mx-auto mt-16 max-w-xl">
          <span className="grid size-14 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary shadow-2xl backdrop-blur">
            <Plane className="size-7 -rotate-12" aria-hidden="true" />
          </span>
          <h2 className="font-display mt-8 text-balance text-5xl font-normal leading-[1.05] tracking-[-0.025em]">
            Satu akun untuk seluruh perjalananmu.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
            Cari penerbangan, lanjutkan pembayaran, pilih kursi, dan kelola
            tiket tanpa berpindah tempat.
          </p>
        </div>
        <div className="relative mx-auto grid w-full max-w-xl gap-3 sm:grid-cols-3">
          {[
            [ShieldCheck, 'Transaksi aman'],
            [Sparkles, 'Harga transparan'],
            [CheckCircle2, 'Alur praktis'],
          ].map(([Icon, label]) => {
            const FeatureIcon = Icon as typeof ShieldCheck;
            return (
              <div
                key={label as string}
                className="rounded-xl border border-border bg-card/55 p-4 backdrop-blur"
              >
                <FeatureIcon
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-bold">{label as string}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
