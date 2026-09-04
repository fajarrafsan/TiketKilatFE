'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  ChevronDown,
  Compass,
  History,
  LayoutDashboard,
  LogOut,
  Plane,
  Ticket,
  UserRound,
} from 'lucide-react';

import { useAuth } from '@/components/auth-provider';
import { Brand } from '@/components/brand';
import {
  BookingGuideMenu,
  DestinationMenu,
  type CatalogNavigation,
} from '@/components/travel-navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const navClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40';

export function SiteHeader({
  catalogNavigation,
}: { catalogNavigation?: CatalogNavigation } = {}) {
  const { session, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const adminArea = session?.role === 'ADMIN' && pathname.startsWith('/admin');
  const links = adminArea
    ? [
        { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard },
        { href: '/admin/flights', label: 'Penerbangan', icon: Plane },
        { href: '/admin/bookings', label: 'Pemesanan', icon: Ticket },
      ]
    : [{ href: '/flights', label: 'Tiket pesawat', icon: Plane }];

  function isActive(href: string) {
    if (href.includes('#')) return false;
    if (href === '/admin') return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  }

  async function handleLogout() {
    setSigningOut(true);
    try {
      await logout();
    } catch {
      // AuthProvider still clears this device's session when the server is unreachable.
    } finally {
      setSigningOut(false);
      router.replace('/login');
    }
  }

  function handleNavigation(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    if (
      href === '/flights' &&
      catalogNavigation &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.altKey &&
      event.button === 0
    ) {
      event.preventDefault();
      catalogNavigation.onSearchFocus();
    }
  }

  return (
    <header className="site-header-premium sticky top-0 z-40 border-b border-border/80 bg-card/95 text-foreground shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="border-b border-border/60">
        <div className="mx-auto flex min-h-8 max-w-7xl items-center justify-between gap-4 px-4 text-xs font-semibold text-muted-foreground sm:px-6 lg:px-8">
          <p>
            <span className="text-primary">TIKETKILAT DEMO</span>
            <span className="hidden sm:inline">
              {' '}
              · Jadwal dan harga untuk pengujian
            </span>
          </p>
          <p>ID · IDR</p>
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Brand />
        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-2 lg:flex"
        >
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={
                href === '/flights'
                  ? (catalogNavigation?.searchHref ?? href)
                  : href
              }
              onClick={(event) => handleNavigation(event, href)}
              aria-current={isActive(href) ? 'page' : undefined}
              className={cn(
                navClass,
                isActive(href) && 'bg-accent text-primary',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
          {!adminArea && (
            <>
              <DestinationMenu
                className={navClass}
                catalogNavigation={catalogNavigation}
              />
              <BookingGuideMenu className={navClass} />
            </>
          )}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    className="h-11 cursor-pointer gap-2 rounded-lg border-border bg-card px-3 sm:px-4"
                  />
                }
                aria-label="Buka menu akun"
              >
                {signingOut ? (
                  <Spinner className="size-4" />
                ) : (
                  <UserRound
                    className="size-4 text-primary"
                    aria-hidden="true"
                  />
                )}
                <span className="font-bold">
                  Akun<span className="hidden sm:inline"> saya</span>
                </span>
                <ChevronDown
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-64 rounded-xl p-2 shadow-xl"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-3 py-2">
                    <span className="block text-xs font-medium">
                      Masuk sebagai
                    </span>
                    <span className="mt-1 block break-all text-sm font-semibold text-foreground">
                      {session.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {session.role === 'ADMIN' ? (
                    <DropdownMenuItem
                      render={<Link href="/admin" />}
                      className="min-h-11 cursor-pointer gap-3 px-3"
                    >
                      <LayoutDashboard />
                      Dashboard admin
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem
                        render={<Link href="/history" />}
                        className="min-h-11 cursor-pointer gap-3 px-3"
                      >
                        <History />
                        Pesanan saya
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        render={<Link href="/profile" />}
                        className="min-h-11 cursor-pointer gap-3 px-3"
                      >
                        <UserRound />
                        Profil saya
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem
                    render={<Link href="/" />}
                    className="min-h-11 cursor-pointer gap-3 px-3"
                  >
                    <Compass />
                    Kembali ke beranda
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={signingOut}
                    onClick={() => void handleLogout()}
                    variant="destructive"
                    className="min-h-11 cursor-pointer gap-3 px-3"
                  >
                    <LogOut />
                    Keluar dari akun
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(navClass, 'px-2 text-foreground sm:px-3')}
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 sm:px-4"
              >
                Daftar
                <ArrowUpRight
                  className="hidden size-4 sm:block"
                  aria-hidden="true"
                />
              </Link>
            </>
          )}
        </div>
      </div>
      <nav
        aria-label="Navigasi seluler"
        className="grid grid-cols-3 border-t border-border/70 px-2 py-1 lg:hidden"
      >
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={
              href === '/flights'
                ? (catalogNavigation?.searchHref ?? href)
                : href
            }
            onClick={(event) => handleNavigation(event, href)}
            aria-current={isActive(href) ? 'page' : undefined}
            className={cn(
              navClass,
              'px-1 text-xs sm:text-sm',
              isActive(href) && 'bg-accent text-primary',
            )}
          >
            {label}
          </Link>
        ))}
        {!adminArea && (
          <>
            <DestinationMenu
              className={cn(navClass, 'px-1 text-xs sm:text-sm')}
              mobile
              catalogNavigation={catalogNavigation}
            />
            <BookingGuideMenu
              className={cn(navClass, 'px-1 text-xs sm:text-sm')}
              mobile
            />
          </>
        )}
      </nav>
    </header>
  );
}
