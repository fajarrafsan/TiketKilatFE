'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Download,
  Edit3,
  FileSpreadsheet,
  MoreHorizontal,
  PlaneTakeoff,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { RouteGuard } from '@/components/route-guard';
import { EmptyPanel, ErrorPanel, LoadingPanel } from '@/components/state-panels';
import { StatusBadge } from '@/components/status-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiDelete, apiDownload, apiGet, apiPost, apiPut } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Flight, FlightPayload, Passenger, SpringPage } from '@/lib/types';

const emptyForm: FlightPayload = {
  maskapai: '',
  kotaKeberangkatan: '',
  kotaTujuan: '',
  waktuKeberangkatan: '',
  waktuKedatangan: '',
  hargaTiket: 0,
  kursi: 30,
};

export default function AdminFlightsPage() {
  return (
    <RouteGuard role="ADMIN">
      <AppShell>
        <FlightsManagement />
      </AppShell>
    </RouteGuard>
  );
}

function FlightsManagement() {
  const [pageData, setPageData] = useState<SpringPage<Flight> | null>(null);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Flight | null>(null);
  const [form, setForm] = useState<FlightPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [passengerOpen, setPassengerOpen] = useState(false);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [passengerTitle, setPassengerTitle] = useState('');
  const [passengerLoading, setPassengerLoading] = useState(false);
  const [passengerError, setPassengerError] = useState('');
  const [exporting, setExporting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), size: '10', urutanBerdasarkan: 'waktuKeberangkatan', arah: direction });
      setPageData(await apiGet<SpringPage<Flight>>(`/admin/Mengambil-semua-data-penerbangan?${params}`));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Data penerbangan belum dapat dimuat.');
    } finally {
      setLoading(false);
    }
  }, [direction, page]);

  useEffect(() => { void load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(flight: Flight) {
    setEditing(flight);
    setForm({
      maskapai: flight.maskapai,
      kotaKeberangkatan: flight.kotaKeberangkatan,
      kotaTujuan: flight.kotaTujuan,
      waktuKeberangkatan: flight.waktuKeberangkatan.slice(0, 16),
      waktuKedatangan: flight.waktuKedatangan.slice(0, 16),
      hargaTiket: flight.hargaTiket,
      kursi: flight.kursi,
    });
    setFormOpen(true);
  }

  async function saveFlight(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setFeedback('');
    if (form.kotaKeberangkatan.trim().toLowerCase() === form.kotaTujuan.trim().toLowerCase()) {
      setError('Kota keberangkatan dan tujuan harus berbeda.');
      return;
    }
    if (new Date(form.waktuKedatangan) <= new Date(form.waktuKeberangkatan)) {
      setError('Waktu kedatangan harus setelah waktu keberangkatan.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { kursi: _ignored, ...updatePayload } = form;
        await apiPut(`/admin/update-data-penerbangan/${editing.id}`, updatePayload);
        setFeedback('Penerbangan berhasil diperbarui.');
      } else {
        await apiPost('/admin/tambah-penerbangan', form as unknown as Record<string, unknown>);
        setFeedback('Penerbangan baru berhasil ditambahkan.');
      }
      setFormOpen(false);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Penerbangan belum dapat disimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteFlight(id: number) {
    setDeleting(id);
    setError('');
    setFeedback('');
    try {
      await apiDelete(`/admin/${id}/hapus-penerbangan`);
      setFeedback('Penerbangan berhasil dihapus.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Penerbangan belum dapat dihapus.');
    } finally {
      setDeleting(null);
    }
  }

  async function showPassengers(flight: Flight) {
    setPassengerOpen(true);
    setPassengerTitle(`${flight.maskapai} · ${flight.kotaKeberangkatan} → ${flight.kotaTujuan}`);
    setPassengerLoading(true);
    setPassengerError('');
    setPassengers([]);
    try {
      setPassengers(await apiGet<Passenger[]>(`/admin/penumpang-per-penerbangan/${flight.id}`));
    } catch (caught) {
      setPassengerError(caught instanceof Error ? caught.message : 'Daftar penumpang belum dapat dimuat.');
    } finally {
      setPassengerLoading(false);
    }
  }

  async function exportHistory(flight: Flight) {
    setExporting(flight.id);
    setError('');
    try {
      await apiDownload(`/admin/${flight.id}/ekspor-history-update-ke-excell`, `histori-${flight.maskapai}-${flight.id}.xlsx`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'File belum dapat diunduh.');
    } finally {
      setExporting(null);
    }
  }

  const visibleFlights = (pageData?.content ?? []).filter((flight) => {
    const value = search.toLowerCase();
    return !value || [flight.maskapai, flight.kotaKeberangkatan, flight.kotaTujuan].some((field) => field.toLowerCase().includes(value));
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="flex items-center gap-2 text-sm font-bold text-primary"><PlaneTakeoff className="size-4" /> Operasional penerbangan</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-slate-950">Data penerbangan</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Tambah jadwal, perbarui rute, lihat penumpang, dan ekspor histori perubahan.</p></div>
        <Button type="button" onClick={openCreate} className="h-11 cursor-pointer rounded-xl px-5 font-bold"><Plus /> Tambah penerbangan</Button>
      </div>

      {feedback && <Alert className="mb-6 border-emerald-200 bg-emerald-50 p-3 text-emerald-800"><AlertDescription className="text-emerald-800">{feedback}</AlertDescription></Alert>}
      {error && <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 p-3"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card className="gap-0 py-0 ring-slate-200">
        <CardContent className="border-b p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari maskapai atau kota…" className="h-11 rounded-xl pl-10" aria-label="Cari penerbangan" /></div>
            <NativeSelect value={direction} onChange={(event) => { setDirection(event.target.value as 'asc' | 'desc'); setPage(0); }} className="h-11 w-full rounded-xl sm:w-52" aria-label="Urutan keberangkatan"><NativeSelectOption value="asc">Terbang terdekat</NativeSelectOption><NativeSelectOption value="desc">Terbang terjauh</NativeSelectOption></NativeSelect>
          </div>
        </CardContent>

        {loading ? <div className="p-5"><LoadingPanel label="Memuat penerbangan…" /></div> : error && !pageData ? <div className="p-5"><ErrorPanel message={error} onRetry={load} /></div> : visibleFlights.length === 0 ? <div className="p-5"><EmptyPanel title="Penerbangan tidak ditemukan" description="Ubah kata pencarian atau tambahkan jadwal penerbangan baru." /></div> : (
          <>
            <Table>
              <TableHeader><TableRow><TableHead className="pl-5">Maskapai & rute</TableHead><TableHead>Keberangkatan</TableHead><TableHead>Harga</TableHead><TableHead>Kursi</TableHead><TableHead>Status</TableHead><TableHead className="pr-5 text-right">Aksi</TableHead></TableRow></TableHeader>
              <TableBody>
                {visibleFlights.map((flight) => (
                  <TableRow key={flight.id}>
                    <TableCell className="min-w-56 pl-5"><p className="font-bold text-slate-950">{flight.maskapai}</p><p className="mt-1 text-xs text-muted-foreground">{flight.kotaKeberangkatan} → {flight.kotaTujuan}</p></TableCell>
                    <TableCell className="min-w-44"><p className="font-semibold">{formatDateTime(flight.waktuKeberangkatan)}</p><p className="mt-1 text-xs text-muted-foreground">Tiba {formatDateTime(flight.waktuKedatangan)}</p></TableCell>
                    <TableCell className="font-bold text-primary">{formatCurrency(flight.hargaTiket)}</TableCell>
                    <TableCell>{flight.kursi ?? '—'}</TableCell>
                    <TableCell><StatusBadge status={flight.ketersediaanPenerbangan ?? flight.statusPenerbangan ?? 'TERSEDIA'} /></TableCell>
                    <TableCell className="pr-5"><div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-lg" onClick={() => showPassengers(flight)} className="size-11 cursor-pointer" aria-label={`Lihat penumpang ${flight.maskapai}`}><UsersRound /></Button>
                      <Button variant="ghost" size="icon-lg" onClick={() => exportHistory(flight)} disabled={exporting === flight.id} className="size-11 cursor-pointer" aria-label={`Ekspor histori ${flight.maskapai}`}>{exporting === flight.id ? <Spinner /> : <FileSpreadsheet />}</Button>
                      <Button variant="ghost" size="icon-lg" onClick={() => openEdit(flight)} className="size-11 cursor-pointer" aria-label={`Edit ${flight.maskapai}`}><Edit3 /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger render={<Button variant="ghost" size="icon-lg" className="size-11 cursor-pointer text-red-600" aria-label={`Hapus ${flight.maskapai}`} />}><Trash2 /></AlertDialogTrigger>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogMedia className="bg-red-100 text-red-700"><Trash2 /></AlertDialogMedia><AlertDialogTitle>Hapus penerbangan?</AlertDialogTitle><AlertDialogDescription>Penerbangan hanya dapat dihapus jika belum memiliki booking yang terhubung.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={deleting === flight.id} onClick={() => deleteFlight(flight.id)}>{deleting === flight.id ? <><Spinner /> Menghapus…</> : 'Hapus'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                      </AlertDialog>
                    </div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row sm:px-5"><p className="text-xs text-muted-foreground">Halaman {(pageData?.number ?? 0) + 1} dari {Math.max(pageData?.totalPages ?? 1, 1)} · {pageData?.totalElements ?? 0} data</p><div className="flex gap-2"><Button variant="outline" disabled={pageData?.first} onClick={() => setPage((value) => Math.max(0, value - 1))} className="h-10 cursor-pointer rounded-xl">Sebelumnya</Button><Button variant="outline" disabled={pageData?.last} onClick={() => setPage((value) => value + 1)} className="h-10 cursor-pointer rounded-xl">Berikutnya</Button></div></div>
          </>
        )}
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle className="text-xl font-extrabold">{editing ? 'Edit penerbangan' : 'Tambah penerbangan'}</DialogTitle><DialogDescription>{editing ? 'Perbarui detail jadwal. Jumlah kursi dipertahankan agar peta kursi tetap konsisten.' : 'Isi seluruh detail untuk menerbitkan jadwal baru.'}</DialogDescription></DialogHeader>
          <form onSubmit={saveFlight} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="airline">Maskapai</Label><Input id="airline" value={form.maskapai} onChange={(event) => setForm({ ...form, maskapai: event.target.value })} className="h-11 rounded-xl" required /></div>
              <div className="space-y-2"><Label htmlFor="from">Kota keberangkatan</Label><Input id="from" value={form.kotaKeberangkatan} onChange={(event) => setForm({ ...form, kotaKeberangkatan: event.target.value })} className="h-11 rounded-xl" required /></div>
              <div className="space-y-2"><Label htmlFor="to">Kota tujuan</Label><Input id="to" value={form.kotaTujuan} onChange={(event) => setForm({ ...form, kotaTujuan: event.target.value })} className="h-11 rounded-xl" required /></div>
              <div className="space-y-2"><Label htmlFor="departure">Waktu keberangkatan</Label><Input id="departure" type="datetime-local" value={form.waktuKeberangkatan} onChange={(event) => setForm({ ...form, waktuKeberangkatan: event.target.value })} className="h-11 rounded-xl" required /></div>
              <div className="space-y-2"><Label htmlFor="arrival">Waktu kedatangan</Label><Input id="arrival" type="datetime-local" value={form.waktuKedatangan} onChange={(event) => setForm({ ...form, waktuKedatangan: event.target.value })} className="h-11 rounded-xl" required /></div>
              <div className="space-y-2"><Label htmlFor="price">Harga tiket</Label><Input id="price" type="number" min={1} value={form.hargaTiket || ''} onChange={(event) => setForm({ ...form, hargaTiket: Number(event.target.value) })} className="h-11 rounded-xl" required /></div>
              <div className="space-y-2"><Label htmlFor="seats">Jumlah kursi</Label><Input id="seats" type="number" min={1} value={form.kursi ?? ''} onChange={(event) => setForm({ ...form, kursi: Number(event.target.value) })} disabled={Boolean(editing)} className="h-11 rounded-xl" required={!editing} /><p className="text-xs text-muted-foreground">{editing ? 'Tidak dapat diubah setelah peta kursi dibuat.' : 'Kursi akan dibuat otomatis.'}</p></div>
            </div>
            <DialogFooter className="-mx-4 -mb-4"><Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="h-11 cursor-pointer rounded-xl">Batal</Button><Button type="submit" disabled={saving} className="h-11 cursor-pointer rounded-xl px-5 font-bold">{saving ? <><Spinner /> Menyimpan…</> : 'Simpan penerbangan'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={passengerOpen} onOpenChange={setPassengerOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle className="text-xl font-extrabold">Daftar penumpang</DialogTitle><DialogDescription>{passengerTitle}</DialogDescription></DialogHeader>
          {passengerLoading ? <LoadingPanel label="Memuat penumpang…" /> : passengerError ? <ErrorPanel message={passengerError} /> : passengers.length === 0 ? <EmptyPanel title="Belum ada penumpang" description="Penumpang yang sudah booking akan muncul di sini." /> : (
            <Table><TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Kontak</TableHead><TableHead>Kode booking</TableHead><TableHead>Kursi</TableHead></TableRow></TableHeader><TableBody>{passengers.map((passenger, index) => <TableRow key={`${passenger.kodeBooking ?? 'passenger'}-${index}`}><TableCell className="font-bold">{passenger.namaPenumpang ?? passenger.nama ?? '—'}</TableCell><TableCell>{passenger.email ?? passenger.noHP ?? '—'}</TableCell><TableCell>{passenger.kodeBooking ?? '—'}</TableCell><TableCell>{passenger.nomorKursi ?? 'Belum dipilih'}</TableCell></TableRow>)}</TableBody></Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
