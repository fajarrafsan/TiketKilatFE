import type { HomeSearchValues } from '@/lib/flight-search';
import { flightSearchHref } from '@/lib/flight-search';
import type { Flight } from '@/lib/types';

export type FlightSort = 'price' | 'duration' | 'departure';
export type DeparturePeriod = 'night' | 'morning' | 'afternoon' | 'evening';
export interface CatalogView {
  sort: FlightSort;
  maxPrice: number;
  periods: DeparturePeriod[];
}
export const emptyFlightSearch: HomeSearchValues = {
  from: '',
  to: '',
  date: '',
  airline: '',
};

export const departurePeriods: {
  value: DeparturePeriod;
  label: string;
  range: string;
}[] = [
  { value: 'night', label: 'Dini hari', range: '00.00 – 05.59' },
  { value: 'morning', label: 'Pagi', range: '06.00 – 11.59' },
  { value: 'afternoon', label: 'Siang & sore', range: '12.00 – 17.59' },
  { value: 'evening', label: 'Malam', range: '18.00 – 23.59' },
];

export function readFlightSearch(value: string): HomeSearchValues {
  const query = new URLSearchParams(value);
  return {
    from: query.get('dari') ?? '',
    to: query.get('ke') ?? '',
    date: query.get('tanggal') ?? '',
    airline: query.get('maskapai') ?? '',
  };
}

export function catalogApiPath(values: HomeSearchValues): string {
  return flightSearchHref(values).replace(
    '/flights',
    '/user/melihat-penerbangan-tersedia',
  );
}

export function mergeSearchOptions(...groups: string[][]): string[] {
  return [...new Set(groups.flat().filter(Boolean))];
}

function timestamp(value: string): number {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Infinity;
}

export function flightDuration(flight: Flight): number {
  const departure = timestamp(flight.waktuKeberangkatan);
  const arrival = timestamp(flight.waktuKedatangan);
  const duration = arrival - departure;
  return Number.isFinite(duration) && duration > 0 ? duration : Infinity;
}

export function departurePeriod(value: string): DeparturePeriod | null {
  const hour = new Date(value).getHours();
  if (!Number.isFinite(hour)) return null;
  return departurePeriods[Math.floor(hour / 6)].value;
}

export function filterCatalog(
  flights: Flight[],
  view: Pick<CatalogView, 'maxPrice' | 'periods'>,
): Flight[] {
  return flights.filter(
    (flight) =>
      (!view.maxPrice || flight.hargaTiket <= view.maxPrice) &&
      (!view.periods.length ||
        view.periods.includes(
          departurePeriod(flight.waktuKeberangkatan) as DeparturePeriod,
        )),
  );
}

export function sortCatalog(flights: Flight[], sort: FlightSort): Flight[] {
  const value = (flight: Flight) =>
    sort === 'price'
      ? Number.isFinite(flight.hargaTiket)
        ? flight.hargaTiket
        : Infinity
      : sort === 'duration'
        ? flightDuration(flight)
        : timestamp(flight.waktuKeberangkatan);
  return [...flights].sort((a, b) => {
    const av = value(a);
    const bv = value(b);
    if (av !== bv) return av < bv ? -1 : 1;
    const at = timestamp(a.waktuKeberangkatan);
    const bt = timestamp(b.waktuKeberangkatan);
    if (at !== bt) return at < bt ? -1 : 1;
    return a.id - b.id;
  });
}

export function arrivalDayOffset(flight: Flight): number {
  const day = (value: string) => {
    const [year, month, date] = value.slice(0, 10).split('-').map(Number);
    return Date.UTC(year, month - 1, date);
  };
  const result = Math.round(
    (day(flight.waktuKedatangan) - day(flight.waktuKeberangkatan)) / 86_400_000,
  );
  return Number.isFinite(result) && result > 0 ? result : 0;
}

export function flightBookingHref(flight: Flight): string {
  const query = new URLSearchParams({
    id: String(flight.id),
    maskapai: flight.maskapai,
    dari: flight.kotaKeberangkatan,
    ke: flight.kotaTujuan,
    berangkat: flight.waktuKeberangkatan,
    tiba: flight.waktuKedatangan,
    harga: String(flight.hargaTiket),
  });
  return `/booking?${query}`;
}
