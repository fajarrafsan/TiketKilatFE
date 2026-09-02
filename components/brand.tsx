import Link from 'next/link';
import { Plane } from 'lucide-react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="flex min-h-11 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
      aria-label="AstraCom, kembali ke beranda"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_22px_rgba(26,115,232,0.22)]">
        <Plane className="size-5 -rotate-12" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-lg font-extrabold tracking-[-0.03em] text-slate-950">
          Astra<span className="text-primary">Com</span>
        </span>
      )}
    </Link>
  );
}
