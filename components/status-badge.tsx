import { Badge } from '@/components/ui/badge';
import { humanizeStatus } from '@/lib/format';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  BELUM_DIBAYAR: 'border-primary/25 bg-primary/10 text-primary',
  SUDAH_DIBAYAR: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  CANCEL: 'border-destructive/25 bg-destructive/10 text-destructive',
  ON_TIME: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
  DEPARTED: 'border-border bg-muted text-muted-foreground',
  ARRIVED: 'border-teal-400/25 bg-teal-400/10 text-teal-200',
  TERSEDIA: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  TIDAK_TERSEDIA: 'border-destructive/25 bg-destructive/10 text-destructive',
};

export function StatusBadge({
  status,
  className,
}: {
  status?: string | null;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        'h-auto px-2.5 py-1 text-xs hover:opacity-100',
        statusStyles[status ?? ''] ?? 'bg-muted text-muted-foreground',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {humanizeStatus(status)}
    </Badge>
  );
}
