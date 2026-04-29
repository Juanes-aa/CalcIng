import { refresh as refreshAccessToken } from './authService';

const API_URL: string = import.meta.env.VITE_API_URL ?? '';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('calcing_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Hace una request autenticada y, si recibe 401, intenta una vez refrescar
 * el access token con el refresh token y reintentar la misma request.
 */
async function authedFetch(input: string, init: RequestInit): Promise<Response> {
  const buildInit = (): RequestInit => ({ ...init, headers: authHeaders() });
  let res = await fetch(input, buildInit());
  if (res.status !== 401) return res;
  try {
    await refreshAccessToken();
  } catch {
    return res;
  }
  res = await fetch(input, buildInit());
  return res;
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

export interface PlanFeature {
  key: string;
  included: boolean;
}

export interface Plan {
  tier: string;
  name: string;
  subtitle_key: string | null;
  currency: string;
  price_monthly: number;
  price_annual: number;
  has_monthly: boolean;
  has_annual: boolean;
  features: PlanFeature[];
  cta_key: string | null;
  is_recommended: boolean;
}

export type BillingCycle = 'monthly' | 'annual';

// ─── API calls ─────────────────────────────────────────────────────────────────

export async function getPlans(): Promise<Plan[]> {
  const res = await fetch(`${API_URL}/billing/plans`);
  if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);
  return res.json();
}

export async function getBillingStatus(): Promise<BillingStatus> {
  const res = await authedFetch(`${API_URL}/billing/status`, { method: 'GET' });
  if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);
  return res.json();
}

export async function createCheckout(
  tier: string,
  cycle: BillingCycle,
): Promise<CheckoutResult> {
  const res = await authedFetch(`${API_URL}/billing/create-checkout`, {
    method: 'POST',
    body: JSON.stringify({ tier, cycle }),
  });
  if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);
  return res.json();
}

export async function cancelSubscription(): Promise<CancelResult> {
  const res = await authedFetch(`${API_URL}/billing/cancel`, { method: 'POST' });
  if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);
  return res.json();
}
