import Link from 'next/link';
import { Plane } from 'lucide-react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="flex min-h-11 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
      aria-label="TiketKilat, kembali ke beranda"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(223,189,118,0.18)]">
        <Plane className="size-5 -rotate-12" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-lg font-extrabold tracking-[-0.03em] text-foreground">
          Tiket<span className="text-primary">Kilat</span>
        </span>
      )}
    </Link>
  );
}
