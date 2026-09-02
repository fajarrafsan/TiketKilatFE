import { AlertCircle, Inbox, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';

export function LoadingPanel({ label = 'Memuat data…' }: { label?: string }) {
  return (
    <div className="flex min-h-52 items-center justify-center rounded-2xl border border-border bg-white">
      <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
        <Spinner className="size-5 text-primary" />
        {label}
      </div>
    </div>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Empty className="min-h-52 border border-red-200 bg-red-50/60">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-red-100 text-red-700">
          <AlertCircle />
        </EmptyMedia>
        <EmptyTitle className="text-red-950">Data belum dapat dimuat</EmptyTitle>
        <EmptyDescription className="text-red-800/80">{message}</EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button type="button" variant="outline" onClick={onRetry} className="h-11 cursor-pointer border-red-200 bg-white">
            <RotateCcw className="size-4" />
            Coba lagi
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

export function EmptyPanel({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <Empty className="min-h-52 border border-border bg-white">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-10 bg-blue-50 text-primary">
          <Inbox className="size-5" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
