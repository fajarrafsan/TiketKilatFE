<p align="center">
  <img src="./public/favicon.svg" width="88" height="88" alt="Logo TiketKilat" />
</p>

<h1 align="center">TiketKilat Frontend</h1>

<p align="center">
  Pengalaman pemesanan tiket pesawat yang cepat, jelas, dan nyaman—dari mencari penerbangan sampai mengunduh e-tiket.
</p>

<p align="center">
  <img alt="React 19.2" src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=08131f" />
  <img alt="TypeScript 5.9" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Tailwind CSS 4.2" src="https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img alt="Node.js 22.13 atau lebih baru" src="https://img.shields.io/badge/Node.js-%E2%89%A522.13-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img alt="76 automated tests" src="https://img.shields.io/badge/tests-76_passing-22C55E?style=for-the-badge&logo=checkmarx&logoColor=white" />
</p>

<p align="center">
  <a href="https://github.com/fajarrafsan/TiketKilatBE"><strong>Backend repository</strong></a>
</p>

![Tampilan TiketKilat](./public/og.png)

## Tentang TiketKilat

TiketKilat adalah frontend web pemesanan tiket pesawat dengan alur end-to-end untuk pengguna dan panel operasional untuk admin. Antarmukanya responsif, menggunakan Bahasa Indonesia, serta memiliki navigasi, state loading/error/empty, dan fokus keyboard yang konsisten.

Alur utama pengguna:

**Cari penerbangan → isi data & unggah KTP → bayar melalui Midtrans → pilih kursi → unduh e-tiket**

## Fitur

### Untuk pengguna

- Pencarian berdasarkan kota asal, tujuan, tanggal, dan maskapai.
- Katalog dengan filter rentang harga dan waktu keberangkatan serta urutan termurah, tercepat, atau paling awal.
- Registrasi, login, refresh token otomatis, dan reset password berbasis OTP.
- Pemesanan satu penumpang dengan unggahan KTP berformat JPG, PNG, atau PDF hingga 2 MB.
- Pembayaran Midtrans Snap di dalam halaman, tanpa membuka tab baru.
- Sinkronisasi status pembayaran dengan backend dan pemulihan transaksi lama menggunakan Order ID.
- Peta kursi interaktif, riwayat pesanan, profil, perubahan password, dan unduhan e-tiket PDF.

### Untuk admin

- Dashboard ringkasan penerbangan, booking, dan tiket terjual.
- Tambah, ubah, hapus, urutkan, dan paginasi data penerbangan.
- Daftar penumpang per penerbangan serta ekspor histori perubahan.
- Pencarian dan filter histori booking serta pembatalan pesanan.
- Route guard terpisah untuk hak akses `USER` dan `ADMIN`.

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Runtime web | Vinext, Vite, React Server Components |
| Komponen | shadcn, Base UI, Lucide React |
| Form & interaksi | React Day Picker, Input OTP, Embla Carousel |
| Visualisasi | Recharts |
| Runtime lokal hasil build | Wrangler / Cloudflare Workers |
| Quality tools | Oxlint, Oxfmt, Node.js Test Runner |

## Mulai secara lokal

### Prasyarat

- Node.js `22.13.0` atau lebih baru.
- pnpm.
- [TiketKilat Backend](https://github.com/fajarrafsan/TiketKilatBE) berjalan di `http://localhost:8090`.

### Instalasi

```powershell
git clone https://github.com/fajarrafsan/TiketKilatFE.git
Set-Location TiketKilatFE
pnpm install
Copy-Item .env.example .env.local
pnpm dev -- --port 3001
```

Buka [http://localhost:3001](http://localhost:3001). Backend perlu mengizinkan origin tersebut pada konfigurasi CORS.

## Environment variables

Isi `.env.local` berdasarkan `.env.example`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8090
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=
```

| Variable | Kegunaan |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL REST API TiketKilat. |
| `NEXT_PUBLIC_SITE_URL` | Origin frontend untuk metadata dan URL publik situs. |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Client Key publik Midtrans dari environment yang sama dengan backend. |

> [!IMPORTANT]
> Semua variable berawalan `NEXT_PUBLIC_` dapat dibaca browser. Jangan pernah menaruh `MIDTRANS_SERVER_KEY`, password, atau secret backend di repository maupun frontend.

## Perintah pengembangan

| Perintah | Fungsi |
| --- | --- |
| `pnpm dev -- --port 3001` | Menjalankan development server di port 3001. |
| `pnpm build` | Membuat production build. |
| `pnpm start` | Menjalankan hasil build melalui Wrangler. |
| `pnpm lint` | Memeriksa source code dengan Oxlint. |
| `pnpm format` | Memformat source code dengan Oxfmt. |
| `pnpm exec tsc --noEmit` | Memeriksa tipe TypeScript tanpa membuat output. |
| `node --test tests/*.test.cjs` | Menjalankan seluruh automated test. |

Suite saat ini mencakup 76 skenario untuk autentikasi, katalog penerbangan, pencarian, navigasi, keamanan URL Midtrans, callback Snap, sinkronisasi pembayaran, dan alur kembali dari payment gateway.

## Struktur proyek

```text
TiketKilatFE/
├── app/                 # Route dan halaman aplikasi
│   ├── admin/           # Dashboard, penerbangan, dan booking admin
│   ├── payment/         # Checkout dan return handler Midtrans
│   └── seats/           # Pemilihan kursi dan e-tiket
├── components/          # Shell, navigasi, form, card, dan komponen UI
│   └── ui/              # Primitive UI reusable
├── hooks/               # State dan fetching katalog penerbangan
├── lib/                 # API client, session, formatter, tipe, dan helper domain
├── public/              # Logo, Open Graph image, dan aset destinasi
└── tests/               # Automated test berbasis Node.js Test Runner
```

## Integrasi backend

API client menambahkan Bearer token untuk route terlindungi dan melakukan satu proses refresh bersama ketika beberapa request menerima `401` bersamaan. Respons `403` tetap diperlakukan sebagai penolakan izin, bukan sebagai alasan untuk melakukan refresh berulang.

Kontrak API dan implementasi server berada di [TiketKilatBE](https://github.com/fajarrafsan/TiketKilatBE). Saat origin, port, atau environment backend berubah, sesuaikan `NEXT_PUBLIC_API_BASE_URL` dan konfigurasi CORS backend secara bersamaan.

<details>
<summary><strong>Catatan integrasi Midtrans</strong></summary>

- Checkout menggunakan Snap.js popup di halaman yang sama; frontend tidak memanggil `window.open`.
- SDK hanya dimuat dari host checkout resmi `app.sandbox.midtrans.com` atau `app.midtrans.com`, berdasarkan `redirectUrl` yang diberikan backend.
- Callback browser dan parameter return URL hanya menjadi pemicu pemeriksaan. Status lunas tetap mengikuti hasil verifikasi backend ke Midtrans.
- Halaman pembayaran memeriksa status secara berkala setiap 8 detik dan menyediakan tombol **Periksa sekarang** tanpa menumpuk request.
- Route `/payment/finish` mengarahkan kembali ke booking yang sesuai bila menerima Order ID yang valid. Nilai `transaction_status` dari URL tidak dipercaya sebagai bukti pembayaran.
- `GET /user/{kodeBooking}/pembayaran` mengambil kembali Snap token milik transaksi yang sama saat halaman dibuka dari riwayat, tab lain, atau perangkat lain. Endpoint ini tidak membuat transaksi baru. Pesanan lama tanpa token mendapat respons `428` dan diarahkan ke pemulihan menggunakan Order ID.
- Dashboard Midtrans tidak menerima `localhost` atau IP sebagai Finish URL. Alur popup lokal tidak bergantung pada Finish URL tersebut. Untuk callback redirect publik, gunakan domain frontend milik sendiri dengan path `/payment/finish`.
- Payment Notification URL harus mengarah ke backend yang dapat dijangkau internet. Saat backend masih lokal tanpa tunnel, status dapat dipulihkan dengan membuka kembali halaman pembayaran agar backend menjalankan sinkronisasi.
- Server Key hanya boleh disimpan di backend. Frontend memerlukan Client Key publik dari akun dan environment Midtrans yang sama.
- Mode dan prefiks key harus sepadan: Sandbox memakai `SB-Mid-server-*`/`SB-Mid-client-*` dengan `MIDTRANS_IS_PRODUCTION=false`, sedangkan Production memakai `Mid-server-*`/`Mid-client-*` dengan `MIDTRANS_IS_PRODUCTION=true`.

</details>

E-tiket baru dapat diunduh ketika backend mengirim `tiketId` pada detail atau riwayat booking. Nilainya masih `null` sebelum kursi dipilih.

## Route utama

| Akses | Route |
| --- | --- |
| Publik | `/`, `/login`, `/register`, `/forgot-password` |
| Pengguna | `/flights`, `/booking`, `/payment/[code]`, `/seats/[code]`, `/history`, `/profile` |
| Admin | `/admin`, `/admin/flights`, `/admin/bookings` |

## Verifikasi sebelum push

```powershell
pnpm lint
pnpm exec tsc --noEmit
node --test tests/*.test.cjs
pnpm build
```

---

<p align="center">
  <strong>TiketKilat</strong><br />
  Pilih rute. Siap berangkat.
</p>
