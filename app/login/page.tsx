'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';

import { AuthShell } from '@/components/auth-shell';
import { useAuth } from '@/components/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await login(email.trim(), password);
      const requested = new URLSearchParams(window.location.search).get('next');
      const fallback = session.role === 'ADMIN' ? '/admin' : '/flights';
      router.replace(requested?.startsWith('/') ? requested : fallback);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Login belum berhasil.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="w-full">
        <p className="text-sm font-bold text-primary">Selamat datang kembali</p>
        <h1 className="page-title">Masuk ke TiketKilat</h1>
        <p className="page-description">
          Lanjutkan perjalanan dan kelola semua pesananmu dari satu tempat.
        </p>

        {error && (
          <Alert
            variant="destructive"
            className="legacy-danger-surface mt-6 border p-3"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
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
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
                className="h-12 rounded-xl pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-primary hover:underline"
              >
                Lupa password?
              </Link>
            </div>
            <div className="relative">
              <LockKeyhole
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan password"
                autoComplete="current-password"
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
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="h-12 w-full cursor-pointer rounded-xl text-sm font-bold shadow-[0_12px_26px_rgba(223,189,118,0.16)]"
          >
            {loading ? (
              <>
                <Spinner /> Memeriksa akun…
              </>
            ) : (
              'Masuk'
            )}
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="font-bold text-primary hover:underline"
          >
            Daftar gratis
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
