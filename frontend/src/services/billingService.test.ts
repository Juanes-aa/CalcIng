import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { getBillingStatus, createCheckout, openCustomerPortal } from './billingService';

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

  it('createCheckout: retorna URL de Stripe', async () => {
    mockFetch.mockReturnValue(jsonResponse({ url: 'https://checkout.stripe.com/test' }));
    const result = await createCheckout('price_pro_monthly');
    expect(result.url).toBe('https://checkout.stripe.com/test');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/billing/create-checkout'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('price_pro_monthly'),
      }),
    );
  });

  it('createCheckout: pasa success_url y cancel_url', async () => {
    mockFetch.mockReturnValue(jsonResponse({ url: 'https://checkout.stripe.com/test' }));
    await createCheckout('price_x', 'https://app/ok', 'https://app/cancel');
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.success_url).toBe('https://app/ok');
    expect(callBody.cancel_url).toBe('https://app/cancel');
  });

  // ─── openCustomerPortal ─────────────────────────────────────────────

  it('openCustomerPortal: retorna URL del portal', async () => {
    mockFetch.mockReturnValue(jsonResponse({ url: 'https://billing.stripe.com/portal' }));
    const result = await openCustomerPortal();
    expect(result.url).toBe('https://billing.stripe.com/portal');
  });

  it('openCustomerPortal: lanza en HTTP error', async () => {
    mockFetch.mockReturnValue(jsonResponse({}, 400));
    await expect(openCustomerPortal()).rejects.toThrow('HTTP_ERROR_400');
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
