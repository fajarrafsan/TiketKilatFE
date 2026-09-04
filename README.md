# TiketKilat Frontend

Frontend aplikasi tiket pesawat TiketKilat menggunakan React, TypeScript, Tailwind CSS, dan komponen shadcn.

## Menjalankan lokal

1. Salin `.env.example` menjadi `.env.local`.
2. Pastikan backend Spring Boot berjalan di `http://localhost:8090`.
3. Jalankan frontend pada port `3001`; backend lokal sudah mengizinkan origin tersebut.

```bash
pnpm dev -- --port 3001
```

## Alur yang tersedia

- Autentikasi: login, registrasi, lupa password dengan OTP, dan refresh token otomatis.
- Pengguna: pencarian penerbangan, booking dan upload KTP, pembayaran Midtrans, pilih kursi, riwayat, serta profil.
- Admin: dashboard, CRUD penerbangan, daftar penumpang, ekspor histori, dan pengelolaan booking.

## Catatan kontrak backend

### Midtrans lokal: popup di dalam halaman

- Dashboard Midtrans pada akun ini menolak Finish URL `localhost`/IP. Jangan gunakan URL lokal tersebut sebagai pengaturan dashboard.
- Tombol bayar sekarang memakai **Snap.js popup**, bukan membuka tab atau meninggalkan TiketKilat. Isi `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` di `.env.local` dengan **Client Key publik** dari akun/lingkungan Midtrans yang sama dengan backend. Jangan pernah menyalin Server Key ke frontend. Muat ulang frontend jika konfigurasi baru belum terbaca.
- Lingkungan SDK (Sandbox/Production) mengikuti `redirectUrl` yang dikembalikan backend. URL SDK hanya boleh berasal dari host resmi Midtrans.
- Semua callback (`onSuccess`, `onPending`, `onError`, `onClose`) ditangani di halaman pesanan. Alur hasil standar tidak bergantung pada Finish URL dashboard. Snap menutup popup sesudah callback; frontend tidak memanggil `hide()` dua kali. `onClose` tidak membatalkan pesanan, dan `onPending` tidak berarti lunas.
- Selama popup terbuka, status backend tetap diperiksa. Ketika backend mengonfirmasi lunas, popup ditutup otomatis dan halaman menampilkan langkah pilih kursi. Jika jaringan/SDK gagal dimuat, tampil pesan yang bisa dicoba ulang, bukan menunggu tanpa batas.
- `uiMode: 'qr'` menjaga alur GoPay/ShopeePay berbasis QR. Metode pihak ketiga yang tetap memerlukan perpindahan ke aplikasi/situs lain (misalnya direct debit/BNPL tertentu) dapat tetap membutuhkan **Finish URL domain publik milik sendiri**. Untuk alur itu, gunakan `<origin-frontend-publik>/payment/finish`; jangan memakai domain contoh atau domain pihak lain. Tidak ada domain, tunnel, atau deployment yang dibuat oleh perubahan ini.
- Route `/payment/finish` membaca `order_id` berformat `ASTRA-XXXXXXXX-<13 angka>` dan meneruskannya sebagai petunjuk pencarian ke halaman booking. Jika order ID tidak dikirim, dipakai booking terakhir pada tab itu, atau riwayat jika tidak ada. Parameter status dari browser tidak dipercaya.
- Halaman pembayaran memeriksa status setiap 8 detik, sesudah callback, dan lewat **Periksa sekarang**. Request tidak ditumpuk. `POST /user/{kodeBooking}/sync-payment` memeriksa pemilik pesanan sebelum backend menghubungi **Get Status API Midtrans** memakai Server Key. Order ID, nominal, mata uang, dan status sukses diperiksa sebelum mengubah status menjadi `SUDAH_DIBAYAR`. Pemeriksaan berhenti setelah lunas. Gangguan jaringan/404 transaksi yang belum dimulai tidak dianggap sebagai pembayaran atau pembatalan.
- **Pesanan baru:** backend menyimpan `midtransOrderId` sebelum meminta token Snap, mengembalikannya sebagai `orderId` pada hasil booking dan `midtransOrderId` pada detail. **Pesanan lama:** gunakan Order ID dari callback/URL kembali atau formulir **Pulihkan status pesanan lama** dengan Order ID lengkap dari dashboard Midtrans. Jangan menebak timestamp, memakai Snap token sebagai Order ID, memasukkan Server Key, atau membayar ulang. ID dari formulir hanya petunjuk; backend tetap memverifikasinya.
- Restart backend **secara manual** setelah perubahan ini. Konfigurasi lokal `spring.jpa.hibernate.ddl-auto=update` menambahkan kolom nullable `midtrans_order_id`; tidak ada data pembayaran lama yang ditandai lunas secara manual. Pengujian otomatis menggunakan mock, bukan transaksi Midtrans/database asli.
- **Payment Notification URL terpisah:** `/payment/notification` tetap membutuhkan alamat backend yang dapat dijangkau internet. Handler memeriksa signature lalu mengambil status terkini dari Midtrans; kegagalan sementara mengembalikan 5xx agar dapat dicoba ulang. Untuk pengembangan localhost tanpa tunnel, sinkronisasi melalui halaman pembayaran dapat bekerja selama backend dapat menghubungi Midtrans. Jika halaman ditutup dan webhook tidak terjangkau, buka lagi halaman pembayaran untuk memeriksa status. Status lunas dilindungi dari penimpaan proses pembatalan/kedaluwarsa.

Referensi: [Snap.js popup dan callback](https://docs.midtrans.com/reference/snap-js), [Get Transaction Status](https://docs.midtrans.com/reference/get-transaction-status), [HTTP notifications](https://docs.midtrans.com/docs/https-notification-webhooks).

### Unduh tiket

Endpoint unduh PDF membutuhkan `tiketId`. Tombol unduh frontend akan aktif ketika field tersebut tersedia pada detail atau riwayat booking.
