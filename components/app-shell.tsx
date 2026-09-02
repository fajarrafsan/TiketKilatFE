'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  History,
  LayoutDashboard,
  LogOut,
  PlaneTakeoff,
  Search,
  TicketCheck,
  UserRound,
} from 'lucide-react';

import { useAuth } from '@/components/auth-provider';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const userLinks = [
  { href: '/flights', label: 'Cari tiket', icon: Search },
  { href: '/history', label: 'Pesanan', icon: History },
  { href: '/profile', label: 'Profil', icon: UserRound },
];

const adminLinks = [
  { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard },
  { href: '/admin/flights', label: 'Penerbangan', icon: PlaneTakeoff },
  { href: '/admin/bookings', label: 'Pemesanan', icon: TicketCheck },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const links = session?.role === 'ADMIN' ? adminLinks : userLinks;

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Brand />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi aplikasi">
            {links.map(({ href, label, icon: Icon }) => {
              const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35',
                    active ? 'bg-blue-50 text-primary' : 'text-slate-600 hover:bg-muted hover:text-slate-950',
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-48 truncate text-xs font-semibold text-muted-foreground lg:block">
              {session?.email}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              onClick={handleLogout}
              className="size-11 cursor-pointer rounded-xl"
              aria-label="Keluar dari akun"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main id="konten-utama" tabIndex={-1}>{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-border bg-white/95 px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-12px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden" aria-label="Navigasi aplikasi seluler">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35',
                active ? 'bg-blue-50 text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
