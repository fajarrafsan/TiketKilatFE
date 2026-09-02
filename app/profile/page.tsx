'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Mail, Save, ShieldCheck, UserRound } from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { RouteGuard } from '@/components/route-guard';
import { ErrorPanel, LoadingPanel } from '@/components/state-panels';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { apiGet, apiPut } from '@/lib/api';
import type { UserProfile } from '@/lib/types';

export default function ProfilePage() {
  return (
    <RouteGuard role="USER">
      <AppShell>
        <ProfileContent />
      </AppShell>
    </RouteGuard>
  );
}

function ProfileContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [passwords, setPasswords] = useState({ current: '', next: '' });
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet<UserProfile>('/user/profile');
      setProfile(data);
      setName(data.nama);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Profil belum dapat dimuat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function updateName(event: React.FormEvent) {
    event.preventDefault();
    setFeedback('');
    setError('');
    if (name.trim().length < 2 || name.trim().length > 25) {
      setError('Nama harus terdiri dari 2–25 karakter.');
      return;
    }
    setSavingName(true);
    try {
      await apiPut('/user/profile-update', { nama: name.trim() });
      setFeedback('Nama profil berhasil diperbarui.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nama belum dapat diperbarui.');
    } finally {
      setSavingName(false);
    }
  }

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    setFeedback('');
    setError('');
    if (passwords.next.length < 5) {
      setError('Password baru minimal 5 karakter.');
      return;
    }
    setSavingPassword(true);
    try {
      await apiPut('/user/change-password', { passwordLama: passwords.current, passwordBaru: passwords.next });
      setPasswords({ current: '', next: '' });
      setFeedback('Password berhasil diperbarui.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Password belum dapat diperbarui.');
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8"><LoadingPanel label="Memuat profil…" /></div>;
  if (error && !profile) return <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8"><ErrorPanel message={error} onRetry={load} /></div>;
  if (!profile) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8">
        <p className="flex items-center gap-2 text-sm font-bold text-primary"><UserRound className="size-4" /> Akunmu</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-slate-950">Profil & keamanan</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Perbarui nama yang tampil dan jaga keamanan akunmu.</p>
      </div>

      {feedback && <Alert className="mb-6 border-emerald-200 bg-emerald-50 p-3 text-emerald-800"><CheckCircle2 /><AlertDescription className="text-emerald-800">{feedback}</AlertDescription></Alert>}
      {error && <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 p-3"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card className="gap-0 py-0 ring-slate-200 lg:self-start">
          <CardContent className="p-6 text-center">
            <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-[linear-gradient(145deg,#dbeafe,#ccfbf1)] text-primary"><UserRound className="size-9" /></span>
            <h2 className="mt-5 text-xl font-extrabold text-slate-950">{profile.nama}</h2>
            <p className="mt-1 break-all text-sm text-muted-foreground">{profile.email}</p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-primary"><ShieldCheck className="size-4" /> Akun {profile.role}</span>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="gap-0 py-0 ring-slate-200">
            <CardHeader className="border-b p-5 sm:p-6"><CardTitle className="text-lg font-extrabold">Informasi pribadi</CardTitle></CardHeader>
            <CardContent className="p-5 sm:p-6">
              <form onSubmit={updateName} className="space-y-5">
                <div className="space-y-2"><Label htmlFor="email">Alamat email</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" value={profile.email} disabled className="h-12 rounded-xl pl-10" /></div><p className="text-xs text-muted-foreground">Email tidak dapat diubah dari aplikasi.</p></div>
                <div className="space-y-2"><Label htmlFor="name">Nama lengkap</Label><Input id="name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={25} className="h-12 rounded-xl" required /></div>
                <Button type="submit" disabled={savingName} className="h-11 cursor-pointer rounded-xl px-5 font-bold">{savingName ? <><Spinner /> Menyimpan…</> : <><Save /> Simpan nama</>}</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0 ring-slate-200">
            <CardHeader className="border-b p-5 sm:p-6"><CardTitle className="flex items-center gap-2 text-lg font-extrabold"><KeyRound className="size-5 text-primary" /> Ganti password</CardTitle></CardHeader>
            <CardContent className="p-5 sm:p-6">
              <form onSubmit={updatePassword} className="space-y-5">
                <div className="space-y-2"><Label htmlFor="current-password">Password saat ini</Label><Input id="current-password" type="password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} autoComplete="current-password" className="h-12 rounded-xl" required /></div>
                <div className="space-y-2"><Label htmlFor="new-password">Password baru</Label><Input id="new-password" type="password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} autoComplete="new-password" minLength={5} className="h-12 rounded-xl" required /><p className="text-xs text-muted-foreground">Minimal 5 karakter. Disarankan tetap mengikuti pola huruf kapital dan angka.</p></div>
                <Button type="submit" disabled={savingPassword} className="h-11 cursor-pointer rounded-xl px-5 font-bold">{savingPassword ? <><Spinner /> Memperbarui…</> : 'Perbarui password'}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
