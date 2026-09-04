'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';

import { AuthShell } from '@/components/auth-shell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { apiPost } from '@/lib/api';

const passwordRule = /^(?=.*[a-z])[A-Z].*\d{3}$/;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (form.name.trim().length < 2) {
      setError('Nama minimal 2 karakter.');
      return;
    }
    if (form.password.length < 5 || !passwordRule.test(form.password)) {
      setError(
        'Password harus diawali huruf kapital, mengandung huruf kecil, dan diakhiri 3 angka.',
      );
      return;
    }

    setLoading(true);
    try {
      await apiPost(
        '/auth/daftar',
        {
          email: form.email.trim(),
          nama: form.name.trim(),
          password: form.password,
          role: null,
        },
        { auth: false },
      );
      router.push('/login?registered=1');
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Pendaftaran belum berhasil.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="w-full">
        <p className="text-sm font-bold text-primary">Mulai perjalananmu</p>
        <h1 className="page-title">Buat akun baru</h1>
        <p className="page-description">
          Daftar sebagai pengguna untuk mulai mencari dan memesan tiket pesawat.
        </p>

        {error && (
          <Alert
            variant="destructive"
            className="legacy-danger-surface mt-6 border p-3"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama lengkap</Label>
            <div className="relative">
              <UserRound
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="name"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="Nama sesuai identitas"
                autoComplete="name"
                minLength={2}
                maxLength={25}
                className="h-12 rounded-xl pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Alamat email</Label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                placeholder="nama@email.com"
                autoComplete="email"
                className="h-12 rounded-xl pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <LockKeyhole
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                placeholder="Contoh: Abc12345"
                autoComplete="new-password"
                className="h-12 rounded-xl pl-10 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-0.5 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
                aria-label={
                  showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                }
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Diawali huruf kapital, mengandung huruf kecil, dan diakhiri 3
              angka.
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="h-12 w-full cursor-pointer rounded-xl text-sm font-bold shadow-[0_12px_26px_rgba(223,189,118,0.16)]"
          >
            {loading ? (
              <>
                <Spinner /> Membuat akun…
              </>
            ) : (
              'Daftar sekarang'
            )}
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-muted-foreground">
          Sudah punya akun?{' '}
          <Link
            href="/login"
            className="font-bold text-primary hover:underline"
          >
            Masuk
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
