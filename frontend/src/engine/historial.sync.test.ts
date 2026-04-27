import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../services/historyService', () => ({
  fetchHistory: vi.fn(),
}));

import { isOnline, loadHistorialSync, mergeHistories } from './historial';
import type { HistoryEntry } from './historial';
import { fetchHistory } from '../services/historyService';

const mockFetchHistory = vi.mocked(fetchHistory);

describe('historial sync', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  // ─── isOnline ────────────────────────────────────────────────────────────

  describe('isOnline', () => {
    it('returns true when calcing_token exists', () => {
      localStorage.setItem('calcing_token', 'some.jwt.token');
      expect(isOnline()).toBe(true);
    });

    it('returns false when calcing_token is missing', () => {
      expect(isOnline()).toBe(false);
    });

    it('returns false when calcing_token is empty string', () => {
      localStorage.setItem('calcing_token', '');
      expect(isOnline()).toBe(false);
    });
  });

  // ─── mergeHistories ──────────────────────────────────────────────────────

  describe('mergeHistories', () => {
    it('returns remote items converted to HistoryEntry format', () => {
      const remote = [{
        id: 'r1', expression: '2+2', result: '4', type: 'solve',
        created_at: '2026-04-01T12:00:00Z',
      }];
      const local: HistoryEntry[] = [];

      const merged = mergeHistories(remote, local);

      expect(merged).toHaveLength(1);
      expect(merged[0]!.id).toBe('r1');
      expect(merged[0]!.expression).toBe('2+2');
      expect(merged[0]!.result).toBe('4');
      expect(merged[0]!.angleMode).toBe('solve');
      expect(merged[0]!.starred).toBe(false);
      expect(typeof merged[0]!.timestamp).toBe('number');
    });

    it('preserves starred flag from matching local entries', () => {
      const remote = [{
        id: 'r1', expression: '2+2', result: '4', type: 'solve',
        created_at: '2026-04-01T12:00:00Z',
      }];
      const local: HistoryEntry[] = [{
        id: 'loc1', expression: '2+2', result: '4',
        angleMode: 'DEG', timestamp: Date.now(), starred: true,
      }];

      const merged = mergeHistories(remote, local);

      expect(merged.some(e => e.expression === '2+2' && e.starred)).toBe(true);
    });

    it('includes local-only entries not present in remote', () => {
      const remote = [{
        id: 'r1', expression: '2+2', result: '4', type: 'solve',
        created_at: '2026-04-01T12:00:00Z',
      }];
      const local: HistoryEntry[] = [{
        id: 'loc_offline', expression: '5*5', result: '25',
        angleMode: 'DEG', timestamp: Date.now(), starred: false,
      }];

      const merged = mergeHistories(remote, local);

      expect(merged).toHaveLength(2);
      expect(merged.some(e => e.expression === '5*5')).toBe(true);
      expect(merged.some(e => e.expression === '2+2')).toBe(true);
    });

    it('does not duplicate entries with same expression and result', () => {
      const remote = [{
        id: 'r1', expression: '2+2', result: '4', type: 'solve',
        created_at: '2026-04-01T12:00:00Z',
      }];
      const local: HistoryEntry[] = [{
        id: 'loc1', expression: '2+2', result: '4',
        angleMode: 'DEG', timestamp: new Date('2026-04-01T12:00:00Z').getTime(), starred: false,
      }];

      const merged = mergeHistories(remote, local);

      const matching = merged.filter(e => e.expression === '2+2' && e.result === '4');
      expect(matching).toHaveLength(1);
    });

    it('sorts merged result by timestamp descending', () => {
      const remote = [
        { id: 'r1', expression: '1+1', result: '2', type: 'solve', created_at: '2026-04-01T10:00:00Z' },
        { id: 'r2', expression: '3+3', result: '6', type: 'solve', created_at: '2026-04-02T10:00:00Z' },
      ];
      const local: HistoryEntry[] = [{
        id: 'loc1', expression: '5*5', result: '25',
        angleMode: 'DEG', timestamp: new Date('2026-04-01T15:00:00Z').getTime(), starred: false,
      }];

      const merged = mergeHistories(remote, local);

      for (let i = 1; i < merged.length; i++) {
        expect(merged[i - 1]!.timestamp).toBeGreaterThanOrEqual(merged[i]!.timestamp);
      }
    });

    it('handles empty remote and empty local', () => {
      const merged = mergeHistories([], []);
      expect(merged).toEqual([]);
    });

    it('handles empty remote with local entries', () => {
      const local: HistoryEntry[] = [{
        id: 'loc1', expression: '1+1', result: '2',
        angleMode: 'DEG', timestamp: Date.now(), starred: true,
      }];

      const merged = mergeHistories([], local);

      expect(merged).toHaveLength(1);
      expect(merged[0]!.starred).toBe(true);
    });
  });

  // ─── loadHistorialSync ────────────────────────────────────────────────────

  describe('loadHistorialSync', () => {
    it('returns localStorage entries when offline (no token)', async () => {
      const localEntries: HistoryEntry[] = [{
        id: 'h1', expression: '1+1', result: '2',
        angleMode: 'DEG', timestamp: Date.now(), starred: false,
      }];
      localStorage.setItem('calcIng_history', JSON.stringify(localEntries));

      const result = await loadHistorialSync();

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]!.expression).toBe('1+1');
      expect(result.source).toBe('local');
    });

    it('fetches from backend and merges when online', async () => {
      localStorage.setItem('calcing_token', 'some.jwt.token');
      localStorage.setItem('calcIng_history', JSON.stringify([]));

      mockFetchHistory.mockResolvedValueOnce({
        items: [
          { id: 'r1', expression: '2+2', result: '4', type: 'solve', created_at: '2026-04-01T12:00:00Z' },
        ],
        nextCursor: null,
      });

      const result = await loadHistorialSync();

      expect(result.source).toBe('synced');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]!.expression).toBe('2+2');
    });

    it('falls back to local on network error', async () => {
      localStorage.setItem('calcing_token', 'some.jwt.token');
      const localEntries: HistoryEntry[] = [{
        id: 'h1', expression: '7+7', result: '14',
        angleMode: 'DEG', timestamp: Date.now(), starred: false,
      }];
      localStorage.setItem('calcIng_history', JSON.stringify(localEntries));

      mockFetchHistory.mockRejectedValueOnce(new Error('NETWORK_ERROR'));

      const result = await loadHistorialSync();

      expect(result.source).toBe('local');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]!.expression).toBe('7+7');
    });

    it('updates localStorage cache after successful sync', async () => {
      localStorage.setItem('calcing_token', 'some.jwt.token');
      localStorage.setItem('calcIng_history', JSON.stringify([]));

      mockFetchHistory.mockResolvedValueOnce({
        items: [
          { id: 'r1', expression: '9+9', result: '18', type: 'solve', created_at: '2026-04-01T12:00:00Z' },
        ],
        nextCursor: null,
      });

      await loadHistorialSync();

      const cached = JSON.parse(localStorage.getItem('calcIng_history') ?? '[]') as HistoryEntry[];
      expect(cached).toHaveLength(1);
      expect(cached[0]!.expression).toBe('9+9');
    });
  });
});
