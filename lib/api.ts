import { clearSession, getSession, setSession } from '@/lib/session';
import { API_BASE_URL } from '@/lib/config';
import type { ApiEnvelope, AuthResponse } from '@/lib/types';

export { API_BASE_URL } from '@/lib/config';

const connectionErrorMessage = `Tidak dapat terhubung ke API di ${API_BASE_URL}. Pastikan backend berjalan dan origin frontend diizinkan.`;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | null;
  auth?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken() {
  const session = getSession();
  if (!session?.refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    const payload = (await response.json()) as ApiEnvelope<AuthResponse>;

    if (!response.ok || !payload.sukses || !payload.data) {
      clearSession();
      return false;
    }

    setSession({
      accessToken: payload.data.aksesToken,
      refreshToken: payload.data.refreshToken,
      role: session.role,
      email: session.email,
    });
    return true;
  } catch {
    clearSession();
    return false;
  }
}

async function request<T>(path: string, options: ApiOptions = {}, retry = true) {
  const { body, auth = true, headers: customHeaders, ...requestOptions } = options;
  const session = getSession();
  if (auth && !session) {
    clearSession();
    throw new ApiError('Sesi tidak tersedia. Silakan masuk kembali.', 401);
  }
  const headers = new Headers(customHeaders);
  let requestBody = body as BodyInit | null | undefined;

  if (body && !(body instanceof FormData) && typeof body === 'object') {
    headers.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  }

  if (auth && session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers,
      body: requestBody,
    });
  } catch {
    throw new ApiError(connectionErrorMessage, 0);
  }

  if (response.status === 401 && auth && retry && session?.refreshToken) {
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
    const refreshed = await refreshPromise;
    if (refreshed) return request<T>(path, options, false);
  }

  const contentType = response.headers.get('content-type') ?? '';
  let payload: ApiEnvelope<T> | null = null;

  if (contentType.includes('application/json')) {
    payload = (await response.json()) as ApiEnvelope<T>;
  }

  if (!response.ok || payload?.sukses === false) {
    if (response.status === 401) clearSession();
    throw new ApiError(
      payload?.pesanNya ?? 'Permintaan belum dapat diproses. Silakan coba lagi.',
      response.status,
    );
  }

  return (payload?.data ?? payload) as T;
}

export function apiGet<T>(path: string, options?: ApiOptions) {
  return request<T>(path, { ...options, method: 'GET' });
}

export function apiPost<T>(path: string, body?: ApiOptions['body'], options?: ApiOptions) {
  return request<T>(path, { ...options, method: 'POST', body });
}

export function apiPut<T>(path: string, body?: ApiOptions['body'], options?: ApiOptions) {
  return request<T>(path, { ...options, method: 'PUT', body });
}

export function apiDelete<T>(path: string, options?: ApiOptions) {
  return request<T>(path, { ...options, method: 'DELETE' });
}

export async function apiDownload(path: string, fileName: string, retry = true) {
  const session = getSession();
  if (!session) {
    clearSession();
    throw new ApiError('Sesi tidak tersedia. Silakan masuk kembali.', 401);
  }
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : undefined,
    });
  } catch {
    throw new ApiError(connectionErrorMessage, 0);
  }

  // Unduhan berumur panjang ikut alur refresh yang sama dengan request JSON,
  // supaya tidak gagal hanya karena access token kedaluwarsa.
  if (response.status === 401 && retry && session.refreshToken) {
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
    if (await refreshPromise) return apiDownload(path, fileName, false);
  }

  if (!response.ok) {
    if (response.status === 401) clearSession();
    let message = 'File belum dapat diunduh.';
    try {
      const payload = (await response.json()) as ApiEnvelope<unknown>;
      message = payload.pesanNya ?? message;
    } catch {
      // Binary error responses do not always contain JSON.
    }
    throw new ApiError(message, response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
