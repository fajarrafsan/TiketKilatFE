import type { Metadata } from 'next';

import { AuthProvider } from '@/components/auth-provider';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  title: {
    default: 'TiketKilat — Pesan Tiket Pesawat Tanpa Ribet',
    template: '%s | TiketKilat',
  },
  description:
    'Cari penerbangan, pesan tiket, lakukan pembayaran, dan pilih kursi dalam satu alur yang mudah bersama TiketKilat.',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'TiketKilat',
    title: 'TiketKilat — Temukan penerbangan terbaik, tanpa ribet.',
    description:
      'Cari penerbangan, pesan tiket, lakukan pembayaran, dan pilih kursi dalam satu alur yang mudah.',
    images: [
      {
        url: '/og.png?v=tiketkilat',
        width: 1731,
        height: 909,
        alt: 'TiketKilat — Temukan penerbangan terbaik, tanpa ribet.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TiketKilat — Temukan penerbangan terbaik, tanpa ribet.',
    description:
      'Cari penerbangan, pesan tiket, lakukan pembayaran, dan pilih kursi dalam satu alur yang mudah.',
    images: ['/og.png?v=tiketkilat'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="tiketkilat-luxe">
        <a
          href="#konten-utama"
          className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground focus:not-sr-only focus:outline-none focus:ring-3 focus:ring-ring"
        >
          Lewati ke konten utama
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
