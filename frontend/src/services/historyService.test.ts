import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchHistory, type HistoryPage } from './historyService';

const FAKE_TOKEN = 'fake.jwt.token';

function mockFetch(response: { status: number; body: unknown }): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json: () => Promise.resolve(response.body),
    text: () => Promise.resolve(JSON.stringify(response.body)),
  }));
}

describe('historyService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('fetchHistory', () => {
    it('calls GET /users/me/history with Bearer token', async () => {
      const page: HistoryPage = { items: [], next_cursor: null };
      mockFetch({ status: 200, body: page });
      localStorage.setItem('calcing_token', FAKE_TOKEN);

      await fetchHistory();

      const fetchFn = vi.mocked(fetch);
      expect(fetchFn).toHaveBeenCalledOnce();
      const [url, opts] = fetchFn.mock.calls[0]!;
      expect(String(url)).toContain('/users/me/history');
      expect((opts as RequestInit).headers).toHaveProperty('Authorization', `Bearer ${FAKE_TOKEN}`);
    });

    it('returns items and nextCursor from backend response', async () => {
      const page: HistoryPage = {
        items: [
          { id: 'abc', expression: '2+2', result: '4', type: 'solve', created_at: '2026-04-01T00:00:00Z' },
        ],
        next_cursor: '2026-04-01T00:00:00Z',
      };
      mockFetch({ status: 200, body: page });
      localStorage.setItem('calcing_token', FAKE_TOKEN);

      const result = await fetchHistory();

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.id).toBe('abc');
      expect(result.nextCursor).toBe('2026-04-01T00:00:00Z');
    });

    it('passes limit and cursor as query params', async () => {
      mockFetch({ status: 200, body: { items: [], next_cursor: null } });
      localStorage.setItem('calcing_token', FAKE_TOKEN);

      await fetchHistory('2026-03-01T00:00:00Z', 10);

      const fetchFn = vi.mocked(fetch);
      const url = String(fetchFn.mock.calls[0]![0]);
      expect(url).toContain('limit=10');
      expect(url).toContain('cursor=2026-03-01T00%3A00%3A00Z');
    });

    it('uses default limit=20 when no limit provided', async () => {
      mockFetch({ status: 200, body: { items: [], next_cursor: null } });
      localStorage.setItem('calcing_token', FAKE_TOKEN);

      await fetchHistory();

      const fetchFn = vi.mocked(fetch);
      const url = String(fetchFn.mock.calls[0]![0]);
      expect(url).toContain('limit=20');
    });

    it('throws UNAUTHORIZED on 401 response', async () => {
      mockFetch({ status: 401, body: { detail: 'Invalid token' } });
      localStorage.setItem('calcing_token', FAKE_TOKEN);

      await expect(fetchHistory()).rejects.toThrow('UNAUTHORIZED');
    });

    it('throws NO_TOKEN when no token in localStorage', async () => {
      await expect(fetchHistory()).rejects.toThrow('NO_TOKEN');
    });

    it('throws HTTP_ERROR on other error status codes', async () => {
      mockFetch({ status: 500, body: { detail: 'Internal error' } });
      localStorage.setItem('calcing_token', FAKE_TOKEN);

      await expect(fetchHistory()).rejects.toThrow('HTTP_ERROR_500');
    });

    it('returns empty items when backend returns empty list', async () => {
      mockFetch({ status: 200, body: { items: [], next_cursor: null } });
      localStorage.setItem('calcing_token', FAKE_TOKEN);

      const result = await fetchHistory();

      expect(result.items).toEqual([]);
      expect(result.nextCursor).toBeNull();
    });

    it('handles multiple items in response', async () => {
      const page: HistoryPage = {
        items: [
          { id: '1', expression: '1+1', result: '2', type: 'solve', created_at: '2026-04-02T00:00:00Z' },
          { id: '2', expression: '3*3', result: '9', type: 'solve', created_at: '2026-04-01T00:00:00Z' },
        ],
        next_cursor: '2026-04-01T00:00:00Z',
      };
      mockFetch({ status: 200, body: page });
      localStorage.setItem('calcing_token', FAKE_TOKEN);

      const result = await fetchHistory();

      expect(result.items).toHaveLength(2);
      expect(result.items[0]!.expression).toBe('1+1');
      expect(result.items[1]!.expression).toBe('3*3');
    });

    it('omits cursor param when not provided', async () => {
      mockFetch({ status: 200, body: { items: [], next_cursor: null } });
      localStorage.setItem('calcing_token', FAKE_TOKEN);

      await fetchHistory();

      const fetchFn = vi.mocked(fetch);
      const url = String(fetchFn.mock.calls[0]![0]);
      expect(url).not.toContain('cursor=');
    });
  });
});
