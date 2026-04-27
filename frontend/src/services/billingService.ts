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
  subscription_id: string;
}

export interface CancelResult {
  status: string;
}

// ─── API calls ─────────────────────────────────────────────────────────────────

export async function getBillingStatus(): Promise<BillingStatus> {
  const res = await fetch(`${API_URL}/billing/status`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);
  return res.json();
}

export async function createCheckout(planId: string): Promise<CheckoutResult> {
  const res = await fetch(`${API_URL}/billing/create-checkout`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ plan_id: planId }),
  });
  if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);
  return res.json();
}

export async function cancelSubscription(): Promise<CancelResult> {
  const res = await fetch(`${API_URL}/billing/cancel`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);
  return res.json();
}
