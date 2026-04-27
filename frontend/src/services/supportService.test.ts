import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { submitTicket, type TicketPayload, type TicketResponse } from './supportService';

const FAKE_TOKEN = 'fake.jwt.token';

function mockFetch(response: { status: number; body: unknown }): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json: () => Promise.resolve(response.body),
    text: () => Promise.resolve(JSON.stringify(response.body)),
  }));
}

const VALID_PAYLOAD: TicketPayload = {
  full_name: 'Juan Pérez',
  eng_id: 'ENG-001',
  category: 'bug',
  description: 'Algo no funciona',
  critical: false,
};

const TICKET_RESPONSE: TicketResponse = {
  id: 't1',
  full_name: 'Juan Pérez',
  eng_id: 'ENG-001',
  category: 'bug',
  description: 'Algo no funciona',
  critical: false,
  status: 'open',
  created_at: '2026-04-01T00:00:00Z',
};

describe('supportService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('calls POST /support with ticket payload', async () => {
    mockFetch({ status: 201, body: TICKET_RESPONSE });
    await submitTicket(VALID_PAYLOAD);
    const fetchFn = vi.mocked(fetch);
    expect(fetchFn).toHaveBeenCalledOnce();
    const [url, opts] = fetchFn.mock.calls[0]!;
    expect(String(url)).toContain('/support');
    expect((opts as RequestInit).method).toBe('POST');
    const body = JSON.parse((opts as RequestInit).body as string) as TicketPayload;
    expect(body.full_name).toBe('Juan Pérez');
    expect(body.category).toBe('bug');
  });

  it('returns ticket response', async () => {
    mockFetch({ status: 201, body: TICKET_RESPONSE });
    const result = await submitTicket(VALID_PAYLOAD);
    expect(result.id).toBe('t1');
    expect(result.status).toBe('open');
  });

  it('sends Authorization header when token exists', async () => {
    mockFetch({ status: 201, body: TICKET_RESPONSE });
    localStorage.setItem('calcing_token', FAKE_TOKEN);
    await submitTicket(VALID_PAYLOAD);
    const fetchFn = vi.mocked(fetch);
    const opts = fetchFn.mock.calls[0]![1] as RequestInit;
    expect(opts.headers).toHaveProperty('Authorization', `Bearer ${FAKE_TOKEN}`);
  });

  it('does not send Authorization header when no token', async () => {
    mockFetch({ status: 201, body: TICKET_RESPONSE });
    await submitTicket(VALID_PAYLOAD);
    const fetchFn = vi.mocked(fetch);
    const headers = (fetchFn.mock.calls[0]![1] as RequestInit).headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('throws on error status', async () => {
    mockFetch({ status: 500, body: { detail: 'Server error' } });
    await expect(submitTicket(VALID_PAYLOAD)).rejects.toThrow('HTTP_ERROR_500');
  });

  it('throws on 422 validation error', async () => {
    mockFetch({ status: 422, body: { detail: 'Validation error' } });
    await expect(submitTicket(VALID_PAYLOAD)).rejects.toThrow('HTTP_ERROR_422');
  });
});
