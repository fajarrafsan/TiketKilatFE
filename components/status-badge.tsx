import { Badge } from '@/components/ui/badge';
import { humanizeStatus } from '@/lib/format';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  BELUM_DIBAYAR: 'bg-amber-100 text-amber-800',
  SUDAH_DIBAYAR: 'bg-emerald-100 text-emerald-800',
  CANCEL: 'bg-red-100 text-red-700',
  ON_TIME: 'bg-blue-100 text-blue-700',
  DEPARTED: 'bg-slate-200 text-slate-700',
  ARRIVED: 'bg-teal-100 text-teal-800',
  TERSEDIA: 'bg-emerald-100 text-emerald-800',
  TIDAK_TERSEDIA: 'bg-red-100 text-red-700',
};

export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  return (
    <Badge className={cn('h-auto px-2.5 py-1 text-[11px] hover:opacity-100', statusStyles[status ?? ''] ?? 'bg-muted text-muted-foreground', className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {humanizeStatus(status)}
    </Badge>
  );
}
