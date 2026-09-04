'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { AppShell } from '@/components/app-shell';
import { RouteGuard } from '@/components/route-guard';
import { LoadingPanel } from '@/components/state-panels';
import {
  PAYMENT_RETURN_STORAGE_KEY,
  paymentReturnPath,
} from '@/lib/payment-navigation';

export default function PaymentFinishPage() {
  return (
    // oxlint-disable-next-line jsx-a11y/aria-role -- RouteGuard's role is an application authorization role, not an HTML ARIA role.
    <RouteGuard role="USER">
      <AppShell>
        <PaymentReturn />
      </AppShell>
    </RouteGuard>
  );
}

function PaymentReturn() {
  const router = useRouter();

  useEffect(() => {
    let fallbackCode: string | null = null;
    try {
      fallbackCode = window.sessionStorage.getItem(PAYMENT_RETURN_STORAGE_KEY);
    } catch {
      // A valid Midtrans order_id still works if browser storage is unavailable.
    }
    router.replace(paymentReturnPath(window.location.search, fallbackCode));
  }, [router]);

  return (
    <div
      className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8"
      aria-live="polite"
      aria-atomic="true"
    >
      <LoadingPanel label="Kembali ke TiketKilat. Memuat pesananmu…" />
    </div>
  );
}
