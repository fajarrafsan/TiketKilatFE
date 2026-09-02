import type { Metadata } from 'next';

import { AuthProvider } from '@/components/auth-provider';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  title: {
    default: 'AstraCom — Pesan Tiket Pesawat Tanpa Ribet',
    template: '%s | AstraCom',
  },
  description:
    'Cari penerbangan, pesan tiket, lakukan pembayaran, dan pilih kursi dalam satu alur yang mudah bersama AstraCom.',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'AstraCom',
    title: 'AstraCom — Temukan penerbangan terbaik, tanpa ribet.',
    description:
      'Cari penerbangan, pesan tiket, lakukan pembayaran, dan pilih kursi dalam satu alur yang mudah.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'AstraCom — Temukan penerbangan terbaik, tanpa ribet.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AstraCom — Temukan penerbangan terbaik, tanpa ribet.',
    description:
      'Cari penerbangan, pesan tiket, lakukan pembayaran, dan pilih kursi dalam satu alur yang mudah.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <a
          href="#konten-utama"
          className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-slate-950 px-4 py-3 font-bold text-white focus:not-sr-only focus:outline-none focus:ring-3 focus:ring-blue-300"
        >
          Lewati ke konten utama
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
