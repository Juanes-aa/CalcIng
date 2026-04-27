import { useState } from 'react';
import { CONSTANTS } from '@engine/constants';
import type { TranslationKey } from '@engine/i18n';
import { useI18n } from '../../hooks/useI18n';

// ─── Grupos ───────────────────────────────────────────────────────────────────

const GROUPS: { labelKey: TranslationKey; keys: string[] }[] = [
  { labelKey: 'constants.group.math',      keys: ['PI', 'E', 'PHI'] },
  { labelKey: 'constants.group.universal', keys: ['C', 'G', 'H', 'HBAR', 'KB'] },
  { labelKey: 'constants.group.em',        keys: ['QE', 'E0', 'MU0'] },
  { labelKey: 'constants.group.atomic',    keys: ['ME'] },
  { labelKey: 'constants.group.thermo',    keys: ['NA', 'R'] },
];

const KEY_NAMES: Record<string, string> = {
  PI:   'pi',
  E:    'euler_number',
  PHI:  'golden_ratio',
  C:    'speed_of_light',
  G:    'gravitational_const',
  H:    'planck_constant',
  HBAR: 'planck_reduced',
  KB:   'boltzmann_const',
  NA:   'avogadro_number',
  E0:   'vacuum_permittivity',
  MU0:  'vacuum_permeability',
  QE:   'elementary_charge',
  ME:   'electron_mass',
  R:    'gas_constant',
};

function formatValue(v: number): string {
  if (Number.isInteger(v) && Math.abs(v) < 1e15) return v.toLocaleString('en-US');
  const s = v.toExponential();
  return s.replace('e+', 'e').replace('e-0', 'e-').replace('e0', '');
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ConstantesViewProps {
  onInsert?: (value: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ConstantesView({ onInsert }: ConstantesViewProps) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string | null>('C');

  const sel = selected ? CONSTANTS[selected] : null;

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden gap-0">

      {/* ── Lista principal ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-7 pt-7 pb-5 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-(--color-on-surface) tracking-tight">{t('constants.title')}</h1>
            <p className="text-xs text-(--color-on-surface-dim) mt-1">
              {t('constants.subtitle')}
            </p>
          </div>
          <button
            onClick={() => sel && onInsert?.(String(sel.value))}
            disabled={!sel}
            className="flex items-center gap-2 px-4 py-2.5 bg-(--color-surface-high) border border-(--color-outline)/30 text-(--color-on-surface) text-xs font-bold uppercase tracking-widest rounded-xl hover:border-(--color-primary-cta)/60 hover:text-(--color-primary) transition-all disabled:opacity-40 shrink-0"
          >
            <span className="text-lg leading-none">+</span>
            <span className="whitespace-pre">{t('constants.insertAction')}</span>
          </button>
        </div>

        {/* Lista con grupos */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {GROUPS.map(group => (
            <div key={group.labelKey} className="mb-5">
              {/* Separador de categoría */}
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px flex-1 bg-(--color-outline)/15" />
                <span className="text-[9px] font-bold tracking-[0.18em] text-(--color-on-surface-dim) uppercase">
                  {t(group.labelKey)}
                </span>
                <div className="h-px flex-1 bg-(--color-outline)/15" />
              </div>

              {/* Filas */}
              <div className="rounded-xl overflow-hidden border border-(--color-outline)/10">
                {group.keys.map((key, i) => {
                  const c = CONSTANTS[key];
                  if (!c) return null;
                  const isSelected = selected === key;
                  return (
                    <button
                      key={key}
                      data-testid={`constant-item-${key}`}
                      onClick={() => setSelected(key)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 text-left transition-all ${
                        i > 0 ? 'border-t border-(--color-outline)/10' : ''
                      } ${
                        isSelected
                          ? 'bg-(--color-primary-cta)/10 border-l-2 border-l-(--color-primary-cta)'
                          : 'bg-(--color-surface-mid) hover:bg-(--color-surface-high)'
                      }`}
                    >
                      {/* Símbolo badge */}
                      <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                        isSelected
                          ? 'bg-(--color-primary-cta)/20 text-(--color-primary)'
                          : 'bg-(--color-surface) text-(--color-on-surface-dim)'
                      }`}>
                        {c.symbol}
                      </div>

                      {/* Nombre + descripción */}
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm text-(--color-on-surface) font-medium">
                          {KEY_NAMES[key] ?? key.toLowerCase()}
                        </div>
                        <div className="text-[11px] text-(--color-on-surface-dim) mt-0.5 truncate">
                          {c.label}
                        </div>
                      </div>

                      {/* Valor + unidad */}
                      <div className="text-right shrink-0">
                        <div className={`font-mono text-sm font-semibold ${
                          isSelected ? 'text-(--color-primary)' : 'text-(--color-success)'
                        }`}>
                          {formatValue(c.value)}
                        </div>
                        {c.unit && (
                          <div className="font-mono text-[10px] text-(--color-on-surface-dim) mt-0.5">
                            {c.unit}
                          </div>
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

      {/* ── Panel de detalle ────────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 border-l border-(--color-outline)/15 flex flex-col overflow-hidden">
        <div className="px-5 pt-6 pb-4 shrink-0 border-b border-(--color-outline)/10">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-(--color-success) inline-block" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-on-surface-dim)">
              {t('constants.detail.title')}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {sel && selected ? (
            <>
              {/* Selected entry */}
              <div className="p-4 bg-(--color-surface-mid) rounded-xl border border-(--color-outline)/15">
                <div className="text-[9px] font-bold uppercase tracking-widest text-(--color-on-surface-dim) mb-2">
                  {t('constants.detail.selected')}
                </div>
                <div className="font-mono text-base font-bold text-(--color-on-surface) mb-2">
                  {KEY_NAMES[selected] ?? selected.toLowerCase()}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-(--color-primary-cta)/15 text-(--color-primary) font-mono text-[11px] rounded-md font-bold">
                    {t('constants.detail.exact')}: {formatValue(sel.value)}
                  </span>
                  <span className="text-[10px] text-(--color-on-surface-dim)">NIST CODATA 2018</span>
                </div>
              </div>

              {/* Símbolo + unidad */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-(--color-surface-mid) rounded-xl border border-(--color-outline)/10">
                  <div className="text-[9px] uppercase tracking-widest text-(--color-on-surface-dim) mb-1">{t('constants.detail.symbol')}</div>
                  <div className="font-mono text-xl font-bold text-(--color-primary)">{sel.symbol}</div>
                </div>
                <div className="p-3 bg-(--color-surface-mid) rounded-xl border border-(--color-outline)/10">
                  <div className="text-[9px] uppercase tracking-widest text-(--color-on-surface-dim) mb-1">{t('constants.detail.unit')}</div>
                  <div className="font-mono text-sm font-semibold text-(--color-on-surface) break-all">
                    {sel.unit || '—'}
                  </div>
                </div>
              </div>

              {/* Valor completo */}
              <div className="p-3 bg-(--color-surface) rounded-xl border border-(--color-outline)/10">
                <div className="text-[9px] uppercase tracking-widest text-(--color-on-surface-dim) mb-2">{t('constants.detail.exactValue')}</div>
                <div className="font-mono text-sm text-(--color-success) break-all">{sel.value}</div>
              </div>

              {/* System precision */}
              <div className="p-4 bg-(--color-surface-mid) rounded-xl border border-(--color-outline)/10 mt-auto">
                <div className="text-[9px] uppercase tracking-widest text-(--color-on-surface-dim) mb-2">
                  {t('constants.detail.systemPrec')}
                </div>
                <div className="text-3xl font-black text-(--color-on-surface) mb-1">100<span className="text-lg">%</span></div>
                <div className="text-[10px] text-(--color-on-surface-dim) mb-3 leading-relaxed">
                  {t('constants.detail.precDesc')}
                </div>
                <div className="h-1.5 bg-(--color-surface) rounded-full overflow-hidden">
                  <div className="h-full bg-(--color-primary-cta) rounded-full w-full" />
                </div>
              </div>

              {/* Botón insertar */}
              <button
                data-testid={`constant-insert-${selected}`}
                onClick={() => onInsert?.(String(sel.value))}
                className="w-full py-3 bg-(--color-primary-cta) text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_2px_16px_rgba(37,99,235,0.25)]"
              >
                {t('constants.detail.insert')}
              </button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-(--color-on-surface-dim) text-xs text-center px-4">
              {t('constants.detail.empty')}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
