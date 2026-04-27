import { useState, useEffect } from 'react';
import { DEFAULT_VARIABLES, VARIABLE_CATEGORIES } from '@engine/variables';
import type { Variable } from '@engine/variables';
import { useI18n } from '../../hooks/useI18n';
import type { TranslationKey } from '@engine/i18n';

// ─── Persistencia ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'calcIng_variables';

function loadVariables(): Variable[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_VARIABLES];
    const parsed = JSON.parse(raw) as Variable[];
    const defaultMap = new Map(DEFAULT_VARIABLES.map(d => [d.id, d]));
    return parsed.map(v => {
      const def = defaultMap.get(v.id);
      if (def) return { ...def, value: v.value };
      return { ...v, nameEn: v.nameEn ?? v.name };
    });
  } catch {
    return [...DEFAULT_VARIABLES];
  }
}

function saveVariables(vars: Variable[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vars));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface VariablesViewProps {
  onInsert?: (value: string) => void;
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface NewVarForm {
  name: string;
  symbol: string;
  value: string;
  unit: string;
}

const EMPTY_FORM: NewVarForm = { name: '', symbol: '', value: '', unit: '' };

// ─── Component ────────────────────────────────────────────────────────────────

export function VariablesView({ onInsert }: VariablesViewProps) {
  const { t, locale } = useI18n();
  const [variables, setVariables] = useState<Variable[]>(loadVariables);
  const [selected,  setSelected]  = useState<string | null>(variables[0]?.id ?? null);
  const [editValue, setEditValue] = useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState<NewVarForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const CAT_KEYS: Record<string, TranslationKey> = {
    'CINEMÁTICA':     'variables.cat.kinematics',
    'DINÁMICA':       'variables.cat.dynamics',
    'ELÉCTRICA':      'variables.cat.electrical',
    'GEOMETRÍA':      'variables.cat.geometry',
    'TERMODINÁMICA':  'variables.cat.thermodynamics',
    'PERSONALIZADAS': 'variables.group.custom',
  };

  function catLabel(cat: string): string {
    const key = CAT_KEYS[cat];
    return key ? t(key) : cat;
  }

  function varName(v: Variable): string {
    return locale === 'en' && v.nameEn ? v.nameEn : v.name;
  }

  const sel = selected ? variables.find(v => v.id === selected) ?? null : null;

  useEffect(() => {
    const defaultMap = new Map(DEFAULT_VARIABLES.map(d => [d.id, d]));
    setVariables(prev => {
      const needsSync = prev.some(v => {
        const def = defaultMap.get(v.id);
        return def && !v.nameEn;
      });
      if (!needsSync) return prev;
      return prev.map(v => {
        const def = defaultMap.get(v.id);
        if (def) return { ...def, value: v.value };
        return { ...v, nameEn: v.nameEn ?? v.name };
      });
    });
  }, []);

  useEffect(() => { saveVariables(variables); }, [variables]);
  useEffect(() => { if (sel) setEditValue(String(sel.value)); }, [sel]);

  // ── Actualizar valor de variable seleccionada ────────────────────────────
  function handleUpdateValue() {
    const n = parseFloat(editValue);
    if (isNaN(n)) return;
    setVariables(prev => prev.map(v => v.id === selected ? { ...v, value: n } : v));
  }

  // ── Añadir variable personalizada ────────────────────────────────────────
  function handleAddVariable() {
    setFormError('');
    if (!form.name.trim() || !form.symbol.trim() || form.value.trim() === '') {
      setFormError(t('variables.form.errorRequired'));
      return;
    }
    const n = parseFloat(form.value);
    if (isNaN(n)) { setFormError(t('variables.form.errorNumeric')); return; }
    const newVar: Variable = {
      id:       genId(),
      symbol:   form.symbol.trim(),
      name:     form.name.trim(),
      nameEn:   form.name.trim(),
      value:    n,
      unit:     form.unit.trim(),
      category: 'PERSONALIZADAS',
      preset:   false,
    };
    setVariables(prev => [...prev, newVar]);
    setSelected(newVar.id);
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  // ── Eliminar variable personalizada ─────────────────────────────────────
  function handleDelete(id: string) {
    setVariables(prev => prev.filter(v => v.id !== id));
    if (selected === id) setSelected(variables.find(v => v.id !== id)?.id ?? null);
  }

  // ── Restablecer defaults ─────────────────────────────────────────────────
  function handleReset() {
    const custom = variables.filter(v => !v.preset);
    setVariables([...DEFAULT_VARIABLES, ...custom]);
  }

  // ── Grupos ──────────────────────────────────────────────────────────────
  const groups = VARIABLE_CATEGORIES.map(cat => ({
    label: cat,
    items: variables.filter(v => v.category === cat),
  })).filter(g => g.items.length > 0);

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden gap-0">

      {/* ── Lista principal ──────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-7 pt-7 pb-5 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-(--color-on-surface) tracking-tight">{t('variables.title')}</h1>
            <p className="text-xs text-(--color-on-surface-dim) mt-1">
              {t('variables.subtitle')}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-(--color-surface-high) border border-(--color-outline)/30 text-(--color-on-surface-dim) text-[11px] font-bold uppercase tracking-widest rounded-xl hover:text-(--color-on-surface) transition-all"
              title={t('variables.resetTooltip')}
            >
              ↺ {t('variables.reset')}
            </button>
            <button
              onClick={() => { setShowForm(v => !v); setFormError(''); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-(--color-surface-high) border border-(--color-outline)/30 text-(--color-on-surface) text-xs font-bold uppercase tracking-widest rounded-xl hover:border-(--color-primary-cta)/60 hover:text-(--color-primary) transition-all"
            >
              <span className="text-lg leading-none">{showForm ? '✕' : '+'}</span>
              <span className="whitespace-pre">{showForm ? t('variables.cancel') : t('variables.new')}</span>
            </button>
          </div>
        </div>

        {/* Formulario nueva variable */}
        {showForm && (
          <div className="mx-6 mb-4 p-4 bg-(--color-surface-mid) rounded-xl border border-(--color-primary-cta)/30 flex flex-col gap-3 shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-(--color-primary) mb-1">
              {t('variables.form.title')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-(--color-on-surface-dim)">{t('variables.form.name')}</label>
                <input
                  type="text" placeholder={t('variables.form.namePlaceholder')}
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="bg-(--color-surface) text-(--color-on-surface) text-sm px-3 py-2 rounded-lg border border-(--color-outline)/40 focus:border-(--color-primary-cta) focus:outline-none transition-colors placeholder:text-(--color-outline)"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-(--color-on-surface-dim)">{t('variables.form.symbol')}</label>
                <input
                  type="text" placeholder={t('variables.form.symbolPlaceholder')}
                  value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
                  className="bg-(--color-surface) text-(--color-on-surface) font-mono text-sm px-3 py-2 rounded-lg border border-(--color-outline)/40 focus:border-(--color-primary-cta) focus:outline-none transition-colors placeholder:text-(--color-outline)"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-(--color-on-surface-dim)">{t('variables.form.value')}</label>
                <input
                  type="number" placeholder={t('variables.form.valuePlaceholder')}
                  value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  className="bg-(--color-surface) text-(--color-on-surface) font-mono text-sm px-3 py-2 rounded-lg border border-(--color-outline)/40 focus:border-(--color-primary-cta) focus:outline-none transition-colors placeholder:text-(--color-outline)"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-(--color-on-surface-dim)">{t('variables.form.unit')}</label>
                <input
                  type="text" placeholder={t('variables.form.unitPlaceholder')}
                  value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  className="bg-(--color-surface) text-(--color-on-surface) font-mono text-sm px-3 py-2 rounded-lg border border-(--color-outline)/40 focus:border-(--color-primary-cta) focus:outline-none transition-colors placeholder:text-(--color-outline)"
                />
              </div>
            </div>
            {formError && <div className="text-xs text-red-400 font-mono">{formError}</div>}
            <button
              onClick={handleAddVariable}
              className="self-end px-5 py-2 bg-(--color-primary-cta) text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all"
            >
              {t('variables.form.submit')}
            </button>
          </div>
        )}

        {/* Lista con grupos */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {groups.map(group => (
            <div key={group.label} className="mb-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px flex-1 bg-(--color-outline)/15" />
                <span className="text-[9px] font-bold tracking-[0.18em] text-(--color-on-surface-dim) uppercase flex items-center gap-1.5">
                  {group.label === 'PERSONALIZADAS' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-(--color-primary-cta) inline-block" />
                  )}
                  {catLabel(group.label)}
                </span>
                <div className="h-px flex-1 bg-(--color-outline)/15" />
              </div>

              <div className="rounded-xl overflow-hidden border border-(--color-outline)/10">
                {group.items.map((v, i) => {
                  const isSelected = selected === v.id;
                  return (
                    <button
                      key={v.id}
                      data-testid={`variable-item-${v.id}`}
                      onClick={() => setSelected(v.id)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 text-left transition-all ${
                        i > 0 ? 'border-t border-(--color-outline)/10' : ''
                      } ${
                        isSelected
                          ? 'bg-(--color-primary-cta)/10 border-l-2 border-l-(--color-primary-cta)'
                          : 'bg-(--color-surface-mid) hover:bg-(--color-surface-high)'
                      }`}
                    >
                      <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                        isSelected
                          ? 'bg-(--color-primary-cta)/20 text-(--color-primary)'
                          : 'bg-(--color-surface) text-(--color-on-surface-dim)'
                      }`}>
                        {v.symbol}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm text-(--color-on-surface) font-medium">{varName(v)}</div>
                        <div className="text-[11px] text-(--color-on-surface-dim) mt-0.5">{catLabel(v.category)}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`font-mono text-sm font-semibold ${
                          isSelected ? 'text-(--color-primary)' : 'text-(--color-success)'
                        }`}>
                          {v.value}
                        </div>
                        {v.unit && (
                          <div className="font-mono text-[10px] text-(--color-on-surface-dim) mt-0.5">{v.unit}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel de detalle ─────────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 border-l border-(--color-outline)/15 flex flex-col overflow-hidden">
        <div className="px-5 pt-6 pb-4 shrink-0 border-b border-(--color-outline)/10">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-(--color-primary-cta) inline-block" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-on-surface-dim)">
              {t('variables.detail.title')}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {sel ? (
            <>
              {/* Info */}
              <div className="p-4 bg-(--color-surface-mid) rounded-xl border border-(--color-outline)/15">
                <div className="text-[9px] font-bold uppercase tracking-widest text-(--color-on-surface-dim) mb-2">
                  {t('variables.detail.label')}
                </div>
                <div className="font-mono text-base font-bold text-(--color-on-surface) mb-1">{varName(sel)}</div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-(--color-primary-cta)/15 text-(--color-primary) font-mono text-[11px] rounded-md font-bold">
                    {sel.symbol}
                  </span>
                  <span className="text-[10px] text-(--color-on-surface-dim)">{catLabel(sel.category)}</span>
                  {!sel.preset && (
                    <span className="ml-auto px-2 py-0.5 bg-amber-500/10 text-amber-400 font-mono text-[10px] rounded-md">
                      {t('variables.detail.customBadge')}
                    </span>
                  )}
                </div>
              </div>

              {/* Editor de valor */}
              <div className="flex flex-col gap-2">
                <div className="text-[9px] font-bold uppercase tracking-widest text-(--color-on-surface-dim)">
                  {t('variables.detail.currentValue')}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUpdateValue()}
                    className="flex-1 min-w-0 bg-(--color-surface) text-(--color-on-surface) font-mono text-sm px-3 py-2 rounded-lg border border-(--color-outline)/40 focus:border-(--color-primary-cta) focus:outline-none transition-colors"
                  />
                  <button
                    onClick={handleUpdateValue}
                    className="px-3 py-2 bg-(--color-surface-high) border border-(--color-outline)/30 text-(--color-on-surface) text-xs font-bold rounded-lg hover:border-(--color-primary-cta)/60 transition-all"
                  >
                    ✓
                  </button>
                </div>
                {sel.unit && (
                  <div className="font-mono text-[11px] text-(--color-on-surface-dim) px-1">{sel.unit}</div>
                )}
              </div>

              {/* Valor completo */}
              <div className="p-3 bg-(--color-surface) rounded-xl border border-(--color-outline)/10">
                <div className="text-[9px] uppercase tracking-widest text-(--color-on-surface-dim) mb-1.5">
                  {t('variables.detail.savedValue')}
                </div>
                <div className="font-mono text-sm text-(--color-success)">{sel.value}</div>
              </div>

              {/* Botón insertar */}
              <button
                data-testid={`variable-insert-${sel.id}`}
                onClick={() => onInsert?.(String(sel.value))}
                className="w-full py-3 bg-(--color-primary-cta) text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_2px_16px_rgba(37,99,235,0.25)]"
              >
                {t('variables.detail.insert')}
              </button>

              {/* Eliminar si es custom */}
              {!sel.preset && (
                <button
                  onClick={() => handleDelete(sel.id)}
                  className="w-full py-2 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/10 transition-all"
                >
                  {t('variables.detail.delete')}
                </button>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-(--color-on-surface-dim) text-xs text-center px-4">
              {t('variables.detail.empty')}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
