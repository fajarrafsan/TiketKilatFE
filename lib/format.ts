export function formatCurrency(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(number) ? number : 0);
}

export function formatDate(value?: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date);
}

export function formatDateTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).format(date);
}

export function formatTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export function formatDuration(start?: string, end?: string) {
  if (!start || !end) return '—';
  const difference = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(difference) || difference <= 0) return '—';

  const totalMinutes = Math.round(difference / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}j ${minutes}m`;
}

export function humanizeStatus(value?: string | null) {
  if (!value) return 'Belum tersedia';
  const labels: Record<string, string> = {
    BELUM_DIBAYAR: 'Belum dibayar',
    SUDAH_DIBAYAR: 'Sudah dibayar',
    CANCEL: 'Dibatalkan',
    ON_TIME: 'Tepat waktu',
    DEPARTED: 'Sudah berangkat',
    ARRIVED: 'Sudah tiba',
    TERSEDIA: 'Tersedia',
    TIDAK_TERSEDIA: 'Tidak tersedia',
  };

  return labels[value] ?? value.replaceAll('_', ' ').toLowerCase();
}

export function countdownLabel(milliseconds: number) {
  if (milliseconds <= 0) return '00:00';
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
