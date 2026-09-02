export type Role = 'USER' | 'ADMIN';

export type PaymentStatus = 'BELUM_DIBAYAR' | 'SUDAH_DIBAYAR' | 'CANCEL';
export type FlightStatus = 'ON_TIME' | 'DEPARTED' | 'ARRIVED';
export type FlightAvailability = 'TERSEDIA' | 'TIDAK_TERSEDIA';

export interface ApiEnvelope<T> {
  sukses: boolean;
  pesanNya: string;
  data?: T;
  statusKode: number;
  stempelWaktu?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  role: Role;
  email: string;
}

export interface AuthResponse {
  aksesToken: string;
  refreshToken: string;
  role: Role;
  email: string;
}

export interface Flight {
  id: number;
  maskapai: string;
  kotaKeberangkatan: string;
  kotaTujuan: string;
  waktuKeberangkatan: string;
  waktuKedatangan: string;
  hargaTiket: number;
  kursi?: number;
  ketersediaanPenerbangan?: FlightAvailability;
  statusPenerbangan?: FlightStatus;
}

export interface Seat {
  id: number;
  nomorKursi: string;
  tersedia?: boolean;
  kursiTersedia?: boolean;
}

export interface BookingCreateResponse {
  kodeBooking: string;
  snapToken: string;
  redirectUrl: string;
  totalHarga: string | number;
}

export interface BookingDetail {
  kodeBooking: string;
  namaPenumpang: string;
  noHP: string;
  maskapai: string;
  dari: string;
  ke: string;
  kotaKeberangkatan?: string;
  kotaTujuan?: string;
  waktuKeberangkatan: string;
  waktuKedatangan: string;
  totalHarga: string | number;
  statusPembayaran: PaymentStatus;
  batasWaktuPembayaran?: string;
  nomorKursi?: string | null;
  tiketId?: number;
}

export interface BookingHistory {
  kodeBooking: string;
  maskapai: string;
  kotaKeberangkatan: string;
  kotaTujuan: string;
  waktuKeberangkatan: string;
  waktuKedatangan?: string;
  totalHarga: string | number;
  statusPembayaran: PaymentStatus;
  nomorKursi?: string | null;
  tiketId?: number;
}

export interface AdminBookingHistory extends BookingHistory {
  namaPenumpang?: string;
  emailUser?: string;
  waktuBooking?: string;
}

export interface Passenger {
  namaPenumpang?: string;
  nama?: string;
  email?: string;
  noHP?: string;
  kodeBooking?: string;
  nomorKursi?: string | null;
}

export interface UserProfile {
  id: number;
  email: string;
  nama: string;
  role: Role;
}

export interface DashboardStats {
  totalPenerbangan: number;
  penerbanganTersedia: number;
  penerbanganBerangkat: number;
  totalBooking: number;
  bookingDibayar: number;
  bookingDibatalkan: number;
  totalTiketTerjual: number;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface FlightPayload {
  maskapai: string;
  kotaKeberangkatan: string;
  kotaTujuan: string;
  waktuKeberangkatan: string;
  waktuKedatangan: string;
  hargaTiket: number;
  kursi?: number;
}
