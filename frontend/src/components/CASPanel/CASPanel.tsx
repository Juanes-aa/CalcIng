import { useState } from 'react';
import { useCAS } from '../../hooks/useCAS';
import type { CASOperation } from '../../hooks/useCAS';
import type { DetailLevel } from '@engine/stepEngine/types';
import { StepViewer } from './StepViewer';

const VARIABLE_OPS = new Set<CASOperation>(['differentiate', 'integrate', 'solveEquation']);
const ORDER_OPS    = new Set<CASOperation>(['differentiate']);

export function CASPanel(): JSX.Element {
  const {
    expression, variable, order, operation, status, result, errorMsg, steps,
    setExpression, setVariable, setOrder, setOperation, execute, reset,
  } = useCAS();

  const [activeTab, setActiveTab] = useState<'simbolico' | 'pasos'>('simbolico');
  const [level, setLevel] = useState<DetailLevel>('intermediate');

  const isLoading    = status === 'loading';
  const hideVariable = !VARIABLE_OPS.has(operation);
  const hideOrder    = !ORDER_OPS.has(operation);

  const inputCls = 'w-full bg-(--color-surface) text-(--color-on-surface) font-mono text-sm px-3 py-2.5 rounded-xl border border-(--color-outline)/40 focus:border-(--color-primary-cta) focus:ring-1 focus:ring-(--color-primary-cta)/30 focus:outline-none transition-all placeholder:text-(--color-outline)';
  const labelCls = 'text-[10px] font-bold text-(--color-on-surface-dim) uppercase tracking-widest';

  return (
    <section
      data-testid="cas-panel"
      className="bg-(--color-surface-low) rounded-xl border border-(--color-outline)/20 flex flex-col overflow-hidden flex-1 min-h-0"
    >
      {/* ── Tabs Simbólico / Pasos ── */}
      <div className="p-1 m-1 flex gap-1 bg-(--color-surface-highest) rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('simbolico')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-200 ${
            activeTab === 'simbolico'
              ? 'bg-(--color-primary-cta) text-white shadow'
              : 'text-(--color-on-surface-dim) hover:text-(--color-on-surface)'
          }`}
        >
          Simbólico
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pasos')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-200 ${
            activeTab === 'pasos'
              ? 'bg-(--color-primary-cta) text-white shadow'
              : 'text-(--color-on-surface-dim) hover:text-(--color-on-surface)'
          }`}
        >
          Pasos
        </button>
      </div>

      {activeTab === 'simbolico' ? (
        <div className="p-4 flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto">

          {/* ── CAS Input ── */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cas-expr" className={labelCls}>CAS Input</label>
            <input
              id="cas-expr"
              data-testid="cas-expression-input"
              type="text"
              value={expression}
              placeholder="Ingresa una expresión..."
              onChange={(e) => setExpression(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* ── Operación pills ── */}
          <div className="grid grid-cols-2 gap-2">
            {([
              { label: 'Simplificar', op: 'simplify'     },
              { label: 'Expandir',    op: 'expand'        },
              { label: 'Resolver',    op: 'solveEquation' },
              { label: 'Derivar',     op: 'differentiate' },
              { label: 'Integrar',    op: 'integrate'     },
              { label: 'Factorizar',  op: 'factor'        },
            ] as const).map(({ label, op }) => (
              <button
                key={op}
                type="button"
                onClick={() => execute(op)}
                disabled={isLoading || !expression.trim()}
                className={`py-2 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  operation === op
                    ? 'bg-(--color-primary-cta)/15 border-(--color-primary-cta)/40 text-(--color-primary)'
                    : 'border-(--color-outline)/20 text-(--color-primary) hover:bg-(--color-primary-cta)/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Variable (condicional) ── */}
          {!hideVariable && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cas-var" className={labelCls}>Variable</label>
              <input
                id="cas-var"
                data-testid="cas-variable-input"
                type="text"
                value={variable}
                placeholder="ej: x"
                onChange={(e) => setVariable(e.target.value)}
                className={inputCls}
              />
            </div>
          )}
          {hideVariable && (
            <input data-testid="cas-variable-input" type="text" value={variable}
              onChange={(e) => setVariable(e.target.value)} hidden />
          )}

          {/* ── Orden (condicional) ── */}
          {!hideOrder && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cas-order" className={labelCls}>Orden</label>
              <input
                id="cas-order"
                data-testid="cas-order-input"
                type="number"
                value={order}
                placeholder="1"
                onChange={(e) => setOrder(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          )}
          {hideOrder && (
            <input data-testid="cas-order-input" type="number" value={order}
              onChange={(e) => setOrder(Number(e.target.value))} hidden />
          )}

          {/* ── Ejecutar / Reset ── */}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
              data-testid="cas-execute-button"
              onClick={() => execute()}
              disabled={isLoading}
              className="py-2.5 bg-(--color-primary-cta) text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_12px_rgba(37,99,235,0.25)]"
            >
              {isLoading ? 'Calculando…' : 'Ejecutar'}
            </button>
            <button
              data-testid="cas-reset-button"
              onClick={() => reset()}
              disabled={isLoading}
              className="px-4 py-2.5 text-(--color-on-surface-dim) text-sm font-bold rounded-xl border border-(--color-outline)/30 hover:text-(--color-on-surface) hover:border-(--color-outline)/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>

          {/* ── Output box ── */}
          <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-outline)/10 min-h-[120px] flex flex-col gap-2">
            <span className="text-[10px] text-(--color-on-surface-dim) uppercase tracking-widest">
              Respuesta simbólica:
            </span>
            {status === 'idle' && (
              <span className="text-(--color-on-surface-dim) text-sm font-mono leading-relaxed">
                Ingresa una expresión y selecciona una operación para comenzar.
              </span>
            )}
            {status === 'success' && (
              <div data-testid="cas-result"
                className="font-mono text-(--color-success) text-sm break-all leading-relaxed">
                {result}
              </div>
            )}
            {status === 'error' && (
              <div data-testid="cas-error" className="text-(--color-error) text-sm">
                {errorMsg}
              </div>
            )}
            {status === 'loading' && (
              <span className="text-(--color-on-surface-dim) text-sm font-mono animate-pulse">
                Calculando…
              </span>
            )}
          </div>

        </div>
      ) : (
        <div className="p-4 flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">

          {/* ── Nivel de detalle ── */}
          <select
            data-testid="cas-detail-level-select"
            value={level}
            onChange={(e) => setLevel(e.target.value as DetailLevel)}
            className="w-full bg-(--color-surface-high) text-(--color-on-surface-dim) text-sm px-3 py-2.5 rounded-xl border border-(--color-outline)/20 focus:outline-none focus:border-(--color-primary-cta) transition-colors cursor-pointer shrink-0"
          >
            <option value="beginner">Principiante</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
          </select>

          {/* ── Pasos ── */}
          {steps.length === 0 ? (
            <span className="text-(--color-on-surface-dim) text-sm font-mono leading-relaxed">
              Ejecuta una operación en la pestaña Simbólico para ver los pasos.
            </span>
          ) : (
            <StepViewer steps={steps} level={level} />
          )}

        </div>
      )}

      {/* ── Barra de estado ── */}
      <div className="px-4 py-3 border-t border-(--color-outline)/10 bg-(--color-surface-high)/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-(--color-on-surface-dim) uppercase tracking-widest">
            Estado del Motor
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-(--color-success) font-bold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-(--color-success) animate-pulse" />
            Online
          </span>
        </div>
        <div className="w-full bg-(--color-surface-highest) h-1 rounded-full overflow-hidden">
          <div className="bg-(--color-primary-cta) h-full w-2/3 rounded-full" />
        </div>
      </div>
    </section>
  );
}