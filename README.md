# AstraCom Frontend

Frontend aplikasi tiket pesawat AstraCom menggunakan React, TypeScript, Tailwind CSS, dan komponen shadcn.

## Menjalankan lokal

1. Salin `.env.example` menjadi `.env.local`.
2. Pastikan backend Spring Boot berjalan di `http://localhost:8080`.
3. Jalankan frontend pada port `3000` agar sesuai dengan CORS bawaan backend.

```bash
pnpm dev -- --port 3000
```

## Alur yang tersedia

- Autentikasi: login, registrasi, lupa password dengan OTP, dan refresh token otomatis.
- Pengguna: pencarian penerbangan, booking dan upload KTP, pembayaran Midtrans, pilih kursi, riwayat, serta profil.
- Admin: dashboard, CRUD penerbangan, daftar penumpang, ekspor histori, dan pengelolaan booking.

## Catatan kontrak backend

Endpoint unduh PDF membutuhkan `tiketId`. Tombol unduh frontend akan aktif ketika field tersebut tersedia pada detail atau riwayat booking.
