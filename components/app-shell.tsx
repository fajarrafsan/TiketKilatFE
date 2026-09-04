import { SiteHeader } from '@/components/site-header';
import type { CatalogNavigation } from '@/components/travel-navigation';

export function AppShell({
  children,
  catalogNavigation,
}: {
  children: React.ReactNode;
  catalogNavigation?: CatalogNavigation;
}) {
  return (
    <div className="tiketkilat-luxe luxe-grid min-h-screen bg-background text-foreground">
      <SiteHeader catalogNavigation={catalogNavigation} />
      <main id="konten-utama" tabIndex={-1} className="relative">
        {children}
      </main>
    </div>
  );
}
