const API_URL: string = import.meta.env.VITE_API_URL ?? '';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('calcing_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface BillingStatus {
  plan: string;
  expires_at: string | null;
}

export interface CheckoutResult {
  url: string;
}

export interface PortalResult {
  url: string;
}

// ─── API calls ─────────────────────────────────────────────────────────────────

export async function getBillingStatus(): Promise<BillingStatus> {
  const res = await fetch(`${API_URL}/billing/status`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);
  return res.json();
}

export async function createCheckout(
  priceId: string,
  successUrl?: string,
  cancelUrl?: string,
): Promise<CheckoutResult> {
  const res = await fetch(`${API_URL}/billing/create-checkout`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      price_id: priceId,
      success_url: successUrl ?? '',
      cancel_url: cancelUrl ?? '',
    }),
  });
  if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);
  return res.json();
}

export async function openCustomerPortal(): Promise<PortalResult> {
  const res = await fetch(`${API_URL}/billing/portal`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);
  return res.json();
}
