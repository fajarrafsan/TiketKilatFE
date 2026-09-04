export const flightCities = [
  'Jakarta',
  'Denpasar',
  'Surabaya',
  'Yogyakarta',
  'Makassar',
  'Medan',
];

export const flightAirlines = [
  'Garuda Indonesia',
  'Batik Air',
  'Citilink',
  'Lion Air',
  'Super Air Jet',
];

export interface HomeSearchValues {
  from: string;
  to: string;
  date: string;
  airline: string;
}

export function localDateValue(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function validateHomeSearch(
  values: HomeSearchValues,
  today = localDateValue(),
) {
  if (values.from && values.to && values.from === values.to) {
    return {
      field: 'to',
      message: 'Kota tujuan harus berbeda dari kota keberangkatan.',
    } as const;
  }
  if (values.date && values.date < today) {
    return {
      field: 'date',
      message: 'Pilih tanggal hari ini atau setelahnya.',
    } as const;
  }
  return null;
}

export function flightSearchHref(values: Partial<HomeSearchValues>): string {
  const query = new URLSearchParams();
  if (values.from) query.set('dari', values.from);
  if (values.to) query.set('ke', values.to);
  if (values.date) query.set('tanggal', values.date);
  if (values.airline) query.set('maskapai', values.airline);
  return `/flights${query.size ? `?${query}` : ''}`;
}
