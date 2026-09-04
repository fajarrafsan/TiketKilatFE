export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8090'
).replace(/\/+$/, '');

// Midtrans explicitly uses its public Client Key in the browser, never its Server Key.
export const MIDTRANS_CLIENT_KEY = (
  process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ''
).trim();
