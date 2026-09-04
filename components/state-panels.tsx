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
    <div className="flex min-h-52 items-center justify-center rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
        <Spinner className="size-5 text-primary" />
        {label}
      </div>
    </div>
  );
}

export function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Empty className="legacy-danger-surface min-h-52 border">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="bg-destructive/15 text-destructive"
        >
          <AlertCircle />
        </EmptyMedia>
        <EmptyTitle className="text-foreground">
          Data belum dapat dimuat
        </EmptyTitle>
        <EmptyDescription className="text-muted-foreground">
          {message}
        </EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            className="h-11 cursor-pointer border-destructive/30 bg-card"
          >
            <RotateCcw className="size-4" />
            Coba lagi
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

export function EmptyPanel({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Empty className="min-h-52 border border-border bg-card">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="size-10 bg-primary/10 text-primary"
        >
          <Inbox className="size-5" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
