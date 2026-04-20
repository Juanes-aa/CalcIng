import { useState, useMemo, type Dispatch, type SetStateAction } from 'react';
import {
  type HistoryEntry,
  saveHistory, relativeTime, isToday, isThisWeek,
} from '@engine/historial';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabFilter = 'all' | 'today' | 'week' | 'starred';

interface HistorialViewProps {
  history:    HistoryEntry[];
  setHistory: Dispatch<SetStateAction<HistoryEntry[]>>;
  onInsert?:  (value: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseResultUnit(result: string): { value: string; unit: string } {
  const m = result.match(/^([\d.,eE+\-]+)\s*(.*)$/);
  if (m) return { value: m[1]!, unit: m[2]?.trim() ?? '' };
  return { value: result, unit: '' };
}

function formatResultDisplay(value: string): string {
  const n = parseFloat(value.replace(/,/g, ''));
  if (!isNaN(n)) {
    if (Math.abs(n) >= 1e6 || (Math.abs(n) < 1e-3 && n !== 0)) {
      return n.toExponential(5);
    }
    return n.toLocaleString('en-US', { maximumFractionDigits: 6 });
  }
  return value;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: TabFilter }) {
  const msgs: Record<TabFilter, string> = {
    all:     'No hay cálculos en el historial.\nPresiona = en la calculadora para empezar.',
    today:   'No hay cálculos hoy.',
    week:    'No hay cálculos esta semana.',
    starred: 'No hay cálculos destacados.\nUsa ★ para marcar los importantes.',
  };
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-(--color-on-surface-dim) px-8 text-center">
      <span className="text-4xl opacity-20">⌚</span>
      <p className="text-xs leading-relaxed whitespace-pre-line">{msgs[filter]}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HistorialView({ history, setHistory, onInsert }: HistorialViewProps) {
  const [tab,      setTab]      = useState<TabFilter>('all');
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState<string | null>(history[0]?.id ?? null);

  // ── Filtro ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = history;
    if (tab === 'today')   list = list.filter(e => isToday(e.timestamp));
    if (tab === 'week')    list = list.filter(e => isThisWeek(e.timestamp));
    if (tab === 'starred') list = list.filter(e => e.starred);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(e =>
        e.expression.toLowerCase().includes(q) ||
        e.result.toLowerCase().includes(q)
      );
    }
    return list;
  }, [history, tab, search]);

  const sel = selected ? (history.find(e => e.id === selected) ?? null) : null;

  // ── Acciones ─────────────────────────────────────────────────────────────
  function toggleStar(id: string) {
    setHistory(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, starred: !e.starred } : e);
      saveHistory(updated);
      return updated;
    });
  }

  function deleteEntry(id: string) {
    setHistory(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveHistory(updated);
      return updated;
    });
    if (selected === id) {
      const next = filtered.find(e => e.id !== id);
      setSelected(next?.id ?? null);
    }
  }

  function clearAll() {
    setHistory([]);
    saveHistory([]);
    setSelected(null);
  }

  // ── Export ───────────────────────────────────────────────────────────────
  function exportEntry(entry: HistoryEntry) {
    const text = `Expression: ${entry.expression}\nResult: ${entry.result}\nMode: ${entry.angleMode}\nDate: ${new Date(entry.timestamp).toLocaleString()}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `calc_${entry.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tabCls = (t: TabFilter) =>
    tab === t
      ? 'px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest bg-(--color-surface-high) text-(--color-on-surface) rounded-lg transition-all'
      : 'px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-(--color-on-surface-dim) hover:text-(--color-on-surface) transition-all';

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden gap-0">

      {/* ── Lista ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-7 pt-7 pb-4 shrink-0">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-black text-(--color-on-surface) uppercase tracking-widest">History</h1>
            <div className="flex items-center gap-1 p-1 bg-(--color-surface-mid) rounded-xl">
              <button onClick={() => setTab('all')}     className={tabCls('all')}>All</button>
              <button onClick={() => setTab('today')}   className={tabCls('today')}>Today</button>
              <button onClick={() => setTab('week')}    className={tabCls('week')}>This Week</button>
              <button onClick={() => setTab('starred')} className={tabCls('starred')}>Starred</button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-on-surface-dim) pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Filter calculations by expression or result..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-(--color-surface-mid) text-(--color-on-surface) text-sm pl-10 pr-4 py-3 rounded-xl border border-(--color-outline)/20 focus:border-(--color-primary-cta)/50 focus:outline-none transition-colors placeholder:text-(--color-on-surface-dim)"
            />
          </div>
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <EmptyState filter={tab} />
        ) : (
          <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-1.5">
            {filtered.map(entry => {
              const { value, unit } = parseResultUnit(entry.result);
              const isSelected = selected === entry.id;
              return (
                <div
                  key={entry.id}
                  role="button"
                  tabIndex={0}
                  data-testid={`history-item-${entry.id}`}
                  onClick={() => setSelected(entry.id)}
                  onKeyDown={e => e.key === 'Enter' && setSelected(entry.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-(--color-primary-cta)/8 border-(--color-primary-cta)/30 border-l-2 border-l-(--color-primary-cta)'
                      : 'bg-(--color-surface-mid) border-(--color-outline)/10 hover:border-(--color-outline)/25'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-(--color-on-surface-dim)">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h12"/>
                      </svg>
                      <span className="uppercase tracking-widest font-bold">Calculadora</span>
                      <span className="text-(--color-primary) ml-1">· {entry.angleMode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-(--color-on-surface-dim)">{relativeTime(entry.timestamp)}</span>
                      <button
                        onClick={e => { e.stopPropagation(); toggleStar(entry.id); }}
                        className={`text-sm transition-all ${entry.starred ? 'text-yellow-400' : 'text-(--color-on-surface-dim) hover:text-yellow-400'}`}
                      >
                        {entry.starred ? '★' : '☆'}
                      </button>
                    </div>
                  </div>
                  <div className="font-mono text-sm text-(--color-on-surface) mb-2 truncate">
                    {entry.expression}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[11px] text-(--color-on-surface-dim) font-mono">R:</span>
                    <span className={`font-mono text-base font-bold ${isSelected ? 'text-(--color-primary)' : 'text-(--color-success)'}`}>
                      {formatResultDisplay(value)}
                    </span>
                    {unit && <span className="font-mono text-[10px] text-(--color-on-surface-dim)">{unit}</span>}
                  </div>
                </div>
              );
            })}

            {history.length > 0 && (
              <button
                onClick={clearAll}
                className="mt-2 self-center text-[11px] text-(--color-on-surface-dim) hover:text-red-400 transition-colors font-mono uppercase tracking-widest"
              >
                Limpiar historial
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Panel de detalle ────────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 border-l border-(--color-outline)/15 flex flex-col overflow-hidden">
        <div className="px-5 pt-6 pb-4 shrink-0 border-b border-(--color-outline)/10 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-on-surface-dim)">
            Calculation Detail
          </span>
          {sel && (
            <div className="flex gap-1">
              <button
                onClick={() => sel && onInsert?.(sel.result)}
                title="Insertar resultado en calculadora"
                className="p-1.5 rounded-lg text-(--color-on-surface-dim) hover:text-(--color-primary) hover:bg-(--color-primary-cta)/10 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </button>
              <button
                onClick={() => sel && deleteEntry(sel.id)}
                title="Eliminar entrada"
                className="p-1.5 rounded-lg text-(--color-on-surface-dim) hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {sel ? (
            <>
              {/* Expression */}
              <div className="p-3 bg-(--color-surface-mid) rounded-xl border border-(--color-outline)/10">
                <div className="text-[9px] font-bold uppercase tracking-widest text-(--color-on-surface-dim) mb-2 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-(--color-surface-high) rounded text-[9px]">EXPRESSION</span>
                </div>
                <div className="font-mono text-sm text-(--color-on-surface) leading-relaxed break-all">
                  {sel.expression}
                </div>
              </div>

              {/* Output Result */}
              <div className="p-3 bg-(--color-surface-mid) rounded-xl border border-(--color-outline)/10">
                <div className="text-[9px] font-bold uppercase tracking-widest text-(--color-on-surface-dim) mb-2">
                  Output Result
                </div>
                {(() => {
                  const { value, unit } = parseResultUnit(sel.result);
                  return (
                    <>
                      <div className="font-mono text-2xl font-bold text-(--color-success) leading-tight break-all">
                        {formatResultDisplay(value)}
                      </div>
                      {unit && <div className="font-mono text-xs text-(--color-success)/70 mt-1">{unit}</div>}
                    </>
                  );
                })()}
              </div>

              {/* Step-by-step */}
              <div className="flex flex-col gap-2">
                <div className="text-[9px] font-bold uppercase tracking-widest text-(--color-on-surface-dim)">
                  Step-by-step Resolution
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex gap-2 items-start">
                    <div className="w-2 h-2 rounded-full border-2 border-(--color-outline)/40 mt-1.5 shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-(--color-on-surface-dim)">Expresión de entrada</span>
                      <span className="font-mono text-[11px] text-(--color-on-surface) break-all">{sel.expression}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className="w-2 h-2 rounded-full bg-(--color-primary-cta) mt-1.5 shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-(--color-on-surface-dim)">Evaluación numérica</span>
                      <span className="font-mono text-[11px] text-(--color-success) break-all">= {sel.result}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="p-3 bg-(--color-surface) rounded-xl border border-(--color-outline)/10">
                <div className="text-[9px] uppercase tracking-widest text-(--color-on-surface-dim) mb-2">
                  Variables Mapping
                </div>
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-(--color-on-surface-dim) uppercase tracking-widest text-[9px]">
                      <th className="text-left pb-1.5">Var</th>
                      <th className="text-left pb-1.5">Value</th>
                      <th className="text-left pb-1.5">Info</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    <tr>
                      <td className="text-(--color-primary) pr-3">expr</td>
                      <td className="text-(--color-on-surface) pr-3 break-all max-w-[80px] truncate">{sel.expression}</td>
                      <td className="text-(--color-on-surface-dim)">input</td>
                    </tr>
                    <tr>
                      <td className="text-(--color-primary) pr-3 pt-1">mode</td>
                      <td className="text-(--color-on-surface) pr-3 pt-1">{sel.angleMode}</td>
                      <td className="text-(--color-on-surface-dim) pt-1">angle</td>
                    </tr>
                    <tr>
                      <td className="text-(--color-primary) pr-3 pt-1">t</td>
                      <td className="text-(--color-on-surface) pr-3 pt-1">{new Date(sel.timestamp).toLocaleTimeString()}</td>
                      <td className="text-(--color-on-surface-dim) pt-1">time</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Export */}
              <button
                onClick={() => exportEntry(sel)}
                className="w-full py-3 flex items-center justify-center gap-2 border border-(--color-outline)/20 text-(--color-on-surface-dim) text-xs font-bold uppercase tracking-widest rounded-xl hover:border-(--color-primary-cta)/40 hover:text-(--color-on-surface) transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Export Result Data
              </button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-(--color-on-surface-dim) text-xs text-center px-4">
              Selecciona un cálculo para ver sus detalles
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
