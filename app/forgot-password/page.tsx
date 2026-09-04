'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from 'lucide-react';

import { AuthShell } from '@/components/auth-shell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { apiPost } from '@/lib/api';

const steps = ['Email', 'Verifikasi OTP', 'Password baru'];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function run(action: () => Promise<void>) {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await action();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Permintaan belum berhasil.',
      );
    } finally {
      setLoading(false);
    }
  }

  function requestOtp(event: React.FormEvent) {
    event.preventDefault();
    void run(async () => {
      await apiPost(
        `/auth/request-lupa-password?email=${encodeURIComponent(email.trim())}`,
        null,
        { auth: false },
      );
      setMessage(
        'Kode OTP telah dikirim ke emailmu dan berlaku selama 5 menit.',
      );
      setStep(1);
    });
  }

  function verifyOtp(event: React.FormEvent) {
    event.preventDefault();
    if (otp.length !== 6) {
      setError('Masukkan 6 digit kode OTP.');
      return;
    }
    void run(async () => {
      await apiPost(
        `/auth/verifikasi-otp?email=${encodeURIComponent(email.trim())}&otp=${encodeURIComponent(otp)}`,
        null,
        { auth: false },
      );
      setMessage('OTP berhasil diverifikasi.');
      setStep(2);
    });
  }

  function resetPassword(event: React.FormEvent) {
    event.preventDefault();
    void run(async () => {
      await apiPost(
        `/auth/reset?email=${encodeURIComponent(email.trim())}&passwordBaru=${encodeURIComponent(password)}`,
        null,
        { auth: false },
      );
      router.push('/login?reset=1');
    });
  }

  return (
    <AuthShell>
      <div className="w-full">
        <Link
          href="/login"
          className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
        >
          <ArrowLeft className="size-4" />
          Kembali ke login
        </Link>
        <p className="text-sm font-bold text-primary">Pemulihan akun</p>
        <h1 className="page-title">Atur ulang password</h1>
        <p className="page-description">
          Ikuti tiga langkah singkat untuk kembali mengakses akunmu.
        </p>

        <ol
          className="mt-6 grid grid-cols-3 gap-2"
          aria-label="Tahap pemulihan password"
        >
          {steps.map((label, index) => (
            <li key={label} className="text-center">
              <span
                className={`mx-auto grid size-8 place-items-center rounded-full text-xs font-extrabold ${index <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                {index < step ? <CheckCircle2 className="size-4" /> : index + 1}
              </span>
              <span
                className={`mt-2 block text-xs font-bold ${index === step ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>

        {message && (
          <Alert className="legacy-success-surface mt-6 border p-3">
            <CheckCircle2 />
            <AlertDescription className="text-current">
              {message}
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert
            variant="destructive"
            className="legacy-danger-surface mt-6 border p-3"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 0 && (
          <form onSubmit={requestOtp} className="mt-7 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Alamat email akun</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@email.com"
                  className="h-12 rounded-xl pl-10"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full cursor-pointer rounded-xl font-bold"
            >
              {loading ? (
                <>
                  <Spinner /> Mengirim OTP…
                </>
              ) : (
                'Kirim kode OTP'
              )}
            </Button>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={verifyOtp} className="mt-7 space-y-5">
            <div className="space-y-3">
              <Label htmlFor="otp">Kode OTP 6 digit</Label>
              <InputOTP
                id="otp"
                maxLength={6}
                value={otp}
                onChange={setOtp}
                inputMode="numeric"
                containerClassName="justify-center sm:justify-start"
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="size-11 text-base"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full cursor-pointer rounded-xl font-bold"
            >
              {loading ? (
                <>
                  <Spinner /> Memverifikasi…
                </>
              ) : (
                'Verifikasi OTP'
              )}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={resetPassword} className="mt-7 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">Password baru</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Masukkan password baru"
                  autoComplete="new-password"
                  minLength={5}
                  className="h-12 rounded-xl pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Gunakan pola yang sama: huruf kapital di awal, huruf kecil, dan
                3 angka di akhir.
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full cursor-pointer rounded-xl font-bold"
            >
              {loading ? (
                <>
                  <Spinner /> Menyimpan…
                </>
              ) : (
                'Simpan password baru'
              )}
            </Button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
