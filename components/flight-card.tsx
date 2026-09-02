import Link from 'next/link';
import { ArrowRight, Clock3, Plane } from 'lucide-react';

import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDate, formatDuration, formatTime } from '@/lib/format';
import type { Flight } from '@/lib/types';

export function FlightCard({ flight }: { flight: Flight }) {
  const query = new URLSearchParams({
    id: String(flight.id),
    maskapai: flight.maskapai,
    dari: flight.kotaKeberangkatan,
    ke: flight.kotaTujuan,
    berangkat: flight.waktuKeberangkatan,
    tiba: flight.waktuKedatangan,
    harga: String(flight.hargaTiket),
  });

  return (
    <Card className="gap-0 py-0 shadow-[0_14px_38px_rgba(15,23,42,0.06)] ring-slate-200 transition-transform duration-200 hover:-translate-y-0.5">
      <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[145px_1fr_auto] lg:items-center">
        <div className="flex items-center gap-3 lg:border-r lg:border-border lg:pr-5">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary">
            <Plane className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-extrabold text-slate-950">{flight.maskapai}</p>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={flight.statusPenerbangan ?? 'ON_TIME'} />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold text-muted-foreground">{formatDate(flight.waktuKeberangkatan, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</p>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-6">
            <div>
              <p className="text-xl font-extrabold text-slate-950">{formatTime(flight.waktuKeberangkatan)}</p>
              <p className="mt-1 max-w-28 truncate text-xs font-semibold text-muted-foreground">{flight.kotaKeberangkatan}</p>
            </div>
            <div className="text-center">
              <p className="mb-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Clock3 className="size-3.5" aria-hidden="true" />
                {formatDuration(flight.waktuKeberangkatan, flight.waktuKedatangan)}
              </p>
              <div className="relative h-px bg-slate-300 before:absolute before:-left-0.5 before:-top-1 before:size-2 before:rounded-full before:border-2 before:border-primary before:bg-white after:absolute after:-right-0.5 after:-top-1 after:size-2 after:rounded-full after:bg-primary" />
              <p className="mt-2 text-[11px] font-semibold text-teal-700">Penerbangan langsung</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-extrabold text-slate-950">{formatTime(flight.waktuKedatangan)}</p>
              <p className="mt-1 max-w-28 truncate text-xs font-semibold text-muted-foreground">{flight.kotaTujuan}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border pt-5 lg:min-w-52 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div>
            <p className="text-xs text-muted-foreground">Harga per orang</p>
            <p className="mt-1 text-lg font-extrabold text-primary">{formatCurrency(flight.hargaTiket)}</p>
          </div>
          <Link href={`/booking?${query}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-[#155fc0] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35">
            Pilih
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
