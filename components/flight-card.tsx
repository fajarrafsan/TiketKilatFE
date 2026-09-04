import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Plane,
  UserRound,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { arrivalDayOffset, flightBookingHref } from '@/lib/flight-catalog';
import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatTime,
} from '@/lib/format';
import type { Flight } from '@/lib/types';

export function FlightCard({ flight }: { flight: Flight }) {
  const nextDay = arrivalDayOffset(flight);
  return (
    <Card className="premium-card rounded-xl transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-[minmax(0,1fr)_190px]">
          <div className="min-w-0 p-5 sm:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                  <Plane className="size-5 -rotate-12" aria-hidden="true" />
                </span>
                <h3 className="font-display text-xl font-normal tracking-[-0.01em]">
                  {flight.maskapai}
                </h3>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
                Sekali jalan
              </span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(76px,1fr)_minmax(0,1fr)] items-center gap-3 sm:gap-5">
              <div>
                <p className="text-xl font-extrabold tabular-nums tracking-tight sm:text-2xl">
                  {formatTime(flight.waktuKeberangkatan)}
                </p>
                <p className="mt-1.5 break-words text-sm font-medium text-muted-foreground">
                  {flight.kotaKeberangkatan}
                </p>
              </div>
              <div className="text-center">
                <p className="mb-3 flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground">
                  <Clock3
                    className="hidden size-3.5 sm:block"
                    aria-hidden="true"
                  />
                  {formatDuration(
                    flight.waktuKeberangkatan,
                    flight.waktuKedatangan,
                  )}
                </p>
                <div className="flex items-center gap-1" aria-hidden="true">
                  <span className="size-2 shrink-0 rounded-full border-2 border-primary" />
                  <span className="h-px flex-1 border-t border-dashed border-input" />
                  <Plane className="size-4 shrink-0 rotate-45 text-primary" />
                  <span className="h-px flex-1 border-t border-dashed border-input" />
                  <span className="size-2 shrink-0 rounded-full bg-primary" />
                </div>
                <p className="mt-2.5 text-xs text-muted-foreground">
                  Durasi jadwal
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold tabular-nums tracking-tight sm:text-2xl">
                  {formatTime(flight.waktuKedatangan)}
                  {nextDay > 0 && (
                    <span
                      className="ml-1 align-top text-xs font-bold text-primary"
                      title={formatDate(flight.waktuKedatangan)}
                    >
                      +{nextDay}
                      <span className="sr-only"> hari</span>
                    </span>
                  )}
                </p>
                <p className="mt-1.5 break-words text-sm font-medium text-muted-foreground">
                  {flight.kotaTujuan}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-stretch justify-between gap-4 border-t border-border bg-travel-soft/45 p-5 sm:flex-row sm:items-center md:flex-col md:items-stretch md:justify-center md:border-l md:border-t-0 md:text-right">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Harga per orang
              </p>
              <p className="mt-1 whitespace-nowrap text-xl font-extrabold tracking-tight text-primary">
                {formatCurrency(flight.hargaTiket)}
              </p>
            </div>
            <Link
              href={flightBookingHref(flight)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              Pilih tiket
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3 text-xs text-muted-foreground sm:px-6">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {formatDate(flight.waktuKeberangkatan, {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
          <p className="flex items-center gap-1.5">
            <UserRound className="size-3.5" aria-hidden="true" />1 penumpang
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
