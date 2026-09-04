import { MIDTRANS_CLIENT_KEY } from '@/lib/config';
import { midtransCheckoutUrl } from '@/lib/payment-navigation';

export interface SnapCallbacks {
  onSuccess: (result: unknown) => void;
  onPending: (result: unknown) => void;
  onError: (result: unknown) => void;
  onClose: () => void;
  language: 'id';
  uiMode: 'qr';
}

export interface MidtransSnap {
  pay: (token: string, callbacks: SnapCallbacks) => void;
  hide: () => void;
}

declare global {
  interface Window {
    snap?: MidtransSnap;
  }
}

const SCRIPT_ID = 'tiketkilat-midtrans-snap';
let pending: {
  src: string;
  key: string;
  promise: Promise<MidtransSnap>;
} | null = null;

export function snapScriptUrl(redirectUrl: unknown): string | null {
  const checkout = midtransCheckoutUrl(redirectUrl);
  return checkout ? `${new URL(checkout).origin}/snap/snap.js` : null;
}

function waitForSnap(promise: Promise<MidtransSnap>): Promise<MidtransSnap> {
  return new Promise((resolve, reject) => {
    // Time out the caller, not the script. Removing a slow async script does not
    // reliably cancel its execution; reinserting it could initialize Snap twice.
    const timeout = window.setTimeout(
      () =>
        reject(
          new Error(
            'Memuat Midtrans terlalu lama. Periksa koneksi, lalu coba lagi.',
          ),
        ),
      15_000,
    );
    promise.then(
      (snap) => {
        window.clearTimeout(timeout);
        resolve(snap);
      },
      (error) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

export function loadMidtransSnap(redirectUrl: string): Promise<MidtransSnap> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(
      new Error('Pembayaran hanya dapat dibuka melalui browser.'),
    );
  }
  const src = snapScriptUrl(redirectUrl);
  if (!src) return Promise.reject(new Error('Tautan Midtrans tidak valid.'));
  if (
    !MIDTRANS_CLIENT_KEY ||
    /server[-_]?key|server-/i.test(MIDTRANS_CLIENT_KEY)
  ) {
    return Promise.reject(
      new Error(
        'Client Key Midtrans belum dikonfigurasi dengan benar. Hubungi pengelola; jangan gunakan Server Key di frontend.',
      ),
    );
  }
  if (pending) {
    if (pending.src !== src || pending.key !== MIDTRANS_CLIENT_KEY) {
      return Promise.reject(
        new Error(
          'Lingkungan Midtrans berubah. Muat ulang halaman sebelum melanjutkan.',
        ),
      );
    }
    return waitForSnap(pending.promise);
  }

  let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (
    script &&
    (script.src !== src ||
      script.getAttribute('data-client-key') !== MIDTRANS_CLIENT_KEY)
  ) {
    return Promise.reject(
      new Error(
        'Konfigurasi Midtrans berbeda. Muat ulang halaman sebelum melanjutkan.',
      ),
    );
  }
  // Preserve the already loaded SDK across page navigation and development HMR.
  if (
    script?.dataset.loaded === 'true' &&
    typeof window.snap?.pay === 'function' &&
    typeof window.snap.hide === 'function'
  ) {
    return Promise.resolve(window.snap);
  }
  if (!script) {
    script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = src;
    script.async = true;
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
  }
  const element = script;
  const promise = new Promise<MidtransSnap>((resolve, reject) => {
    const cleanUp = () => {
      element.removeEventListener('load', onLoad);
      element.removeEventListener('error', onError);
    };
    const fail = (message: string, retryable = false) => {
      cleanUp();
      if (retryable) {
        element.remove();
        pending = null;
      }
      reject(new Error(message));
    };
    const onLoad = () => {
      if (
        typeof window.snap?.pay !== 'function' ||
        typeof window.snap.hide !== 'function'
      ) {
        fail('Midtrans belum siap. Muat ulang halaman lalu coba lagi.');
        return;
      }
      element.dataset.loaded = 'true';
      cleanUp();
      resolve(window.snap);
    };
    const onError = () =>
      fail(
        'Midtrans tidak dapat dimuat. Periksa koneksi atau pemblokir konten, lalu coba lagi.',
        true,
      );
    element.addEventListener('load', onLoad);
    element.addEventListener('error', onError);
  });
  pending = { src, key: MIDTRANS_CLIENT_KEY, promise };
  if (!element.isConnected) document.head.appendChild(element);
  return waitForSnap(promise);
}
