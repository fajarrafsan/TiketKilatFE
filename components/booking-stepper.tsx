import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

const steps = ['Detail', 'Pembayaran', 'Pilih kursi', 'E-Tiket'];

export function BookingStepper({ current }: { current: number }) {
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Tahap pemesanan">
      {steps.map((step, index) => {
        const completed = index < current;
        const active = index === current;
        return (
          <li
            key={step}
            className="relative flex flex-col items-center gap-2 text-center"
          >
            {index > 0 && (
              <span
                className={cn(
                  'absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2',
                  index <= current ? 'bg-primary' : 'bg-border',
                )}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'relative z-10 grid size-8 place-items-center rounded-full border-2 text-xs font-extrabold',
                completed || active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground',
              )}
              aria-current={active ? 'step' : undefined}
            >
              {completed ? <Check className="size-4" /> : index + 1}
            </span>
            <span
              className={cn(
                'text-xs font-bold',
                active
                  ? 'text-primary'
                  : completed
                    ? 'text-foreground'
                    : 'text-muted-foreground',
              )}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
