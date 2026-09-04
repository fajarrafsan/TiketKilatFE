// Keep the backend's existing booking-code format; this is not a payment-status check.
const bookingCodePattern = /^ASTRA-[A-F0-9]{8}$/;
const midtransOrderPattern = /^(ASTRA-[A-F0-9]{8})-\d{13}$/;

export const PAYMENT_RETURN_STORAGE_KEY = 'astracom.payment.return';

// This is only a lookup hint. The authenticated backend must verify it with Midtrans.
export function midtransOrderId(value: unknown, code: string): string | null {
  if (typeof value !== 'string') return null;
  const candidate = value.trim();
  return midtransOrderPattern.exec(candidate)?.[1] === code ? candidate : null;
}

export function snapResultOrderId(
  result: unknown,
  code: string,
): string | null {
  if (!result || typeof result !== 'object') return null;
  const data = result as Record<string, unknown>;
  const direct = midtransOrderId(data.order_id, code);
  if (direct) return direct;
  // Some Snap methods supply only finish_redirect_url. Extract an ID, never navigate to it.
  try {
    if (typeof data.finish_redirect_url !== 'string') return null;
    const params = new URL(data.finish_redirect_url).searchParams;
    const ids = params.getAll('order_id');
    return ids.length === 1 ? midtransOrderId(ids[0], code) : null;
  } catch {
    return null;
  }
}

export function paymentReturnPath(
  search: string,
  fallbackCode?: string | null,
): string {
  const params = new URLSearchParams(search);
  const orderIds = params.getAll('order_id');
  // Some payment methods return without query parameters. Only use the same-tab
  // booking as a fallback when no order ID was supplied, never for an invalid one.
  const code =
    orderIds.length === 0
      ? fallbackCode
      : orderIds.length === 1
        ? midtransOrderPattern.exec(orderIds[0])?.[1]
        : null;

  // transaction_status/status_code in the URL are untrusted. The payment page
  // will ask the authenticated backend to verify this lookup hint with Midtrans.
  return code && bookingCodePattern.test(code)
    ? `/payment/${encodeURIComponent(code)}?from=midtrans${orderIds.length === 1 ? `&order_id=${encodeURIComponent(orderIds[0])}` : ''}`
    : '/history';
}

export function midtransCheckoutUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      !['app.sandbox.midtrans.com', 'app.midtrans.com'].includes(
        url.hostname,
      ) ||
      url.username ||
      url.password ||
      url.port ||
      !url.pathname.startsWith('/snap/')
    )
      return null;
    return value;
  } catch {
    return null;
  }
}
