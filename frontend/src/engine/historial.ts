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

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min  = Math.floor(diff / 60_000);
  const hr   = Math.floor(diff / 3_600_000);
  const day  = Math.floor(diff / 86_400_000);
  if (min < 1)   return 'Ahora';
  if (min < 60)  return `${min} min ago`;
  if (hr  < 24)  return `${hr} hour${hr > 1 ? 's' : ''} ago`;
  if (day === 1) return 'Yesterday';
  return `${day} days ago`;
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
