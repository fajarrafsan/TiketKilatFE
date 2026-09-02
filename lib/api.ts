import { clearSession, getSession, setSession } from '@/lib/session';
import type { ApiEnvelope, AuthResponse } from '@/lib/types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

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
    throw new ApiError(
      'Tidak dapat terhubung ke server. Pastikan backend berjalan di localhost:8080.',
      0,
    );
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

export async function apiDownload(path: string, fileName: string) {
  const session = getSession();
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : undefined,
    });
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server.', 0);
  }

  if (!response.ok) {
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
