/**
 * historial.ts
 * Modelo y servicio de persistencia del historial de cálculos.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id:         string;
  expression: string;
  result:     string;
  angleMode:  string;
  timestamp:  number;
  starred:    boolean;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'calcIng_history';
const MAX_ENTRIES = 200;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genId(): string {
  return `h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function createEntry(
  expression: string,
  result: string,
  angleMode: string,
): HistoryEntry {
  return {
    id:         genId(),
    expression,
    result,
    angleMode,
    timestamp:  Date.now(),
    starred:    false,
  };
}

// ─── Formateo de tiempo relativo ─────────────────────────────────────────────

import { t, type TranslationKey } from './i18n';
import type { Locale } from './ajustes';
import { fetchHistory, type HistoryItemRemote } from '../services/historyService';

export function relativeTime(ts: number, locale: Locale = 'es'): string {
  const diff = Date.now() - ts;
  const min  = Math.floor(diff / 60_000);
  const hr   = Math.floor(diff / 3_600_000);
  const day  = Math.floor(diff / 86_400_000);
  const tt = (key: TranslationKey, params?: Record<string, string | number>) => t(key, locale, params);
  if (min < 1)   return tt('history.time.now');
  if (min < 60)  return tt('history.time.minAgo', { n: min });
  if (hr === 1)  return tt('history.time.hourAgo');
  if (hr  < 24)  return tt('history.time.hoursAgo', { n: hr });
  if (day === 1) return tt('history.time.yesterday');
  return tt('history.time.daysAgo', { n: day });
}

// ─── Filtros de tiempo ────────────────────────────────────────────────────────

export function isToday(ts: number): boolean {
  const d = new Date(ts);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() &&
         d.getMonth()    === n.getMonth()    &&
         d.getDate()     === n.getDate();
}

export function isThisWeek(ts: number): boolean {
  return Date.now() - ts < 7 * 86_400_000;
}

// ─── Sync con backend ────────────────────────────────────────────────────────

export function isOnline(): boolean {
  const token = localStorage.getItem('calcing_token');
  return token !== null && token !== '';
}

export function mergeHistories(
  remote: HistoryItemRemote[],
  local: HistoryEntry[],
): HistoryEntry[] {
  const remoteConverted: HistoryEntry[] = remote.map(r => {
    const localMatch = local.find(
      l => l.expression === r.expression && l.result === r.result,
    );
    return {
      id:         r.id,
      expression: r.expression,
      result:     r.result,
      angleMode:  r.type,
      timestamp:  new Date(r.created_at).getTime(),
      starred:    localMatch?.starred ?? false,
    };
  });

  const remoteKeys = new Set(
    remote.map(r => `${r.expression}::${r.result}`),
  );

  const localOnly = local.filter(
    l => !remoteKeys.has(`${l.expression}::${l.result}`),
  );

  const merged = [...remoteConverted, ...localOnly];
  merged.sort((a, b) => b.timestamp - a.timestamp);
  return merged;
}

export interface SyncResult {
  entries: HistoryEntry[];
  source:  'synced' | 'local';
}

export async function loadHistorialSync(): Promise<SyncResult> {
  const local = loadHistory();

  if (!isOnline()) {
    return { entries: local, source: 'local' };
  }

  try {
    const page = await fetchHistory();
    const merged = mergeHistories(page.items, local);
    saveHistory(merged);
    return { entries: merged, source: 'synced' };
  } catch {
    return { entries: local, source: 'local' };
  }
}
