import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { getBillingStatus, createCheckout, cancelSubscription } from './billingService';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem('calcing_token', 'test.jwt.token');
});

afterEach(() => {
  localStorage.clear();
});

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
}

describe('billingService', () => {

  // ─── getBillingStatus ───────────────────────────────────────────────

  it('getBillingStatus: retorna plan y expires_at', async () => {
    mockFetch.mockReturnValue(jsonResponse({ plan: 'pro', expires_at: '2026-05-01T00:00:00Z' }));
    const result = await getBillingStatus();
    expect(result.plan).toBe('pro');
    expect(result.expires_at).toBe('2026-05-01T00:00:00Z');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/billing/status'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test.jwt.token' }) }),
    );
  });

  it('getBillingStatus: lanza en HTTP error', async () => {
    mockFetch.mockReturnValue(jsonResponse({}, 401));
    await expect(getBillingStatus()).rejects.toThrow('HTTP_ERROR_401');
  });

  // ─── createCheckout ─────────────────────────────────────────────────

  it('createCheckout: retorna init_point de Mercado Pago y subscription_id', async () => {
    mockFetch.mockReturnValue(jsonResponse({
      url: 'https://www.mercadopago.com.co/subscriptions/checkout?xxx',
      subscription_id: 'sub_abc123',
    }));
    const result = await createCheckout('pro', 'monthly');
    expect(result.url).toBe('https://www.mercadopago.com.co/subscriptions/checkout?xxx');
    expect(result.subscription_id).toBe('sub_abc123');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/billing/create-checkout'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"tier":"pro"'),
      }),
    );
  });

  it('createCheckout: envía tier y cycle en el body', async () => {
    mockFetch.mockReturnValue(jsonResponse({ url: 'https://x', subscription_id: 'sub_x' }));
    await createCheckout('enterprise', 'annual');
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.tier).toBe('enterprise');
    expect(callBody.cycle).toBe('annual');
    // No debe enviar success_url ni cancel_url (campos del flujo Stripe)
    expect(callBody.success_url).toBeUndefined();
    expect(callBody.cancel_url).toBeUndefined();
    expect(callBody.price_id).toBeUndefined();
  });

  it('createCheckout: lanza en HTTP error', async () => {
    mockFetch.mockReturnValue(jsonResponse({}, 400));
    await expect(createCheckout('pro', 'monthly')).rejects.toThrow('HTTP_ERROR_400');
  });

  // ─── cancelSubscription ─────────────────────────────────────────────

  it('cancelSubscription: retorna status="cancelled"', async () => {
    mockFetch.mockReturnValue(jsonResponse({ status: 'cancelled' }));
    const result = await cancelSubscription();
    expect(result.status).toBe('cancelled');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/billing/cancel'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('cancelSubscription: lanza en HTTP error', async () => {
    mockFetch.mockReturnValue(jsonResponse({}, 400));
    await expect(cancelSubscription()).rejects.toThrow('HTTP_ERROR_400');
  });

  // ─── Auth header ────────────────────────────────────────────────────

  it('envía Authorization header vacío sin token', async () => {
    localStorage.removeItem('calcing_token');
    mockFetch.mockReturnValue(jsonResponse({ plan: 'free', expires_at: null }));
    await getBillingStatus();
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBeUndefined();
  });
});
