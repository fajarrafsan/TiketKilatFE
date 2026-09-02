'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/components/auth-provider';
import { Spinner } from '@/components/ui/spinner';
import type { Role } from '@/lib/types';

export function RouteGuard({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: Role;
}) {
  const { session, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      const destination = `${pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(destination)}`);
      return;
    }
    if (role && session.role !== role) {
      router.replace(session.role === 'ADMIN' ? '/admin' : '/flights');
    }
  }, [pathname, ready, role, router, session]);

  if (!ready || !session || (role && session.role !== role)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
          <Spinner className="size-5 text-primary" />
          Menyiapkan akunmu…
        </div>
      </div>
    );
  }

  return children;
}
