import { useState } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type KeyCategory = 'number' | 'operator' | 'function' | 'action';

interface KeyDef {
  label: string;
  value: string;
  category: KeyCategory;
  span?: number;
}

export interface CalculatorKeypadProps {
  onKeyPress: (key: string) => void;
  angleMode?: 'RAD' | 'DEG' | 'GRAD';
  disabled?: boolean;
}

// ─── Layout Básico — 7 columnas × 6 filas ───────────────────────────────────

const KEYS_BASIC: KeyDef[] = [
  { label: 'sin',   value: 'sin(',       category: 'function' },
  { label: 'cos',   value: 'cos(',       category: 'function' },
  { label: 'tan',   value: 'tan(',       category: 'function' },
  { label: 'log',   value: 'log(',       category: 'function' },
  { label: 'ln',    value: 'ln(',        category: 'function' },
  { label: '√',     value: 'sqrt(',      category: 'function' },
  { label: 'x²',    value: '^2',         category: 'function' },

  { label: 'π',     value: 'pi',         category: 'function' },
  { label: 'e',     value: 'e',          category: 'function' },
  { label: '(',     value: '(',          category: 'operator' },
  { label: ')',     value: ')',          category: 'operator' },
  { label: 'DEL',   value: 'BACKSPACE',  category: 'action'   },
  { label: 'AC',    value: 'CLEAR',      category: 'action'   },
  { label: 'x!',    value: 'factorial(', category: 'function' },

  { label: '7',     value: '7',          category: 'number'   },
  { label: '8',     value: '8',          category: 'number'   },
  { label: '9',     value: '9',          category: 'number'   },
  { label: '÷',     value: '/',          category: 'operator' },
  { label: 'MOD',   value: 'mod(',       category: 'function' },
  { label: 'abs',   value: 'abs(',       category: 'function' },
  { label: 'ANS',   value: 'ANS',        category: 'function' },

  { label: '4',     value: '4',          category: 'number'   },
  { label: '5',     value: '5',          category: 'number'   },
  { label: '6',     value: '6',          category: 'number'   },
  { label: '×',     value: '*',          category: 'operator' },
  { label: 'ceil',  value: 'ceil(',      category: 'function' },
  { label: 'floor', value: 'floor(',     category: 'function' },
  { label: 'round', value: 'round(',     category: 'function' },

  { label: '1',     value: '1',          category: 'number'   },
  { label: '2',     value: '2',          category: 'number'   },
  { label: '3',     value: '3',          category: 'number'   },
  { label: '-',     value: '-',          category: 'operator' },
  { label: 'nCr',   value: 'nCr(',       category: 'function' },
  { label: 'nPr',   value: 'nPr(',       category: 'function' },
  { label: '%',     value: '%',          category: 'operator' },

  { label: '0',     value: '0',          category: 'number'   },
  { label: '.',     value: '.',          category: 'number'   },
  { label: '=',     value: '=',          category: 'action'   },
  { label: '+',     value: '+',          category: 'operator' },
  { label: 'rand',  value: 'RAND',       category: 'function' },
  { label: 'sign',  value: 'sign(',      category: 'function' },
  { label: ',',     value: ',',          category: 'operator' },
];

// ─── Layout Expandido — 5 columnas × 11 filas ───────────────────────────────

const KEYS_EXPANDED: KeyDef[] = [
  // Fila 1 — Trigonometría
  { label: 'sin',    value: 'sin(',       category: 'function' },
  { label: 'cos',    value: 'cos(',       category: 'function' },
  { label: 'tan',    value: 'tan(',       category: 'function' },
  { label: 'log',    value: 'log(',       category: 'function' },
  { label: 'ln',     value: 'ln(',        category: 'function' },
  // Fila 2 — Inversas
  { label: 'sin⁻¹',  value: 'asin(',      category: 'function' },
  { label: 'cos⁻¹',  value: 'acos(',      category: 'function' },
  { label: 'tan⁻¹',  value: 'atan(',      category: 'function' },
  { label: 'eˣ',     value: 'exp(',       category: 'function' },
  { label: '√',      value: 'sqrt(',      category: 'function' },
  // Fila 3 — Hiperbólicas
  { label: 'sinh',   value: 'sinh(',      category: 'function' },
  { label: 'cosh',   value: 'cosh(',      category: 'function' },
  { label: 'tanh',   value: 'tanh(',      category: 'function' },
  { label: '∛',      value: 'cbrt(',      category: 'function' },
  { label: '|x|',    value: 'abs(',       category: 'function' },
  // Fila 4 — Potencias
  { label: 'x²',     value: '^2',         category: 'function' },
  { label: 'x³',     value: '^3',         category: 'function' },
  { label: 'xʸ',     value: '^',          category: 'operator' },
  { label: '1/x',    value: '^(-1)',      category: 'function' },
  { label: 'n!',     value: 'factorial(', category: 'function' },
  // Fila 5 — Constantes y utilidades
  { label: 'π',      value: 'pi',         category: 'function' },
  { label: 'e',      value: 'e',          category: 'function' },
  { label: 'mod',    value: 'mod(',       category: 'function' },
  { label: 'ANS',    value: 'ANS',        category: 'function' },
  { label: '±',      value: 'NEGATE',     category: 'function' },
  // Fila 6 — Acciones
  { label: 'AC',     value: 'CLEAR',      category: 'action'   },
  { label: '⌫',     value: 'BACKSPACE',  category: 'action'   },
  { label: '%',      value: '%',          category: 'operator' },
  { label: '÷',      value: '/',          category: 'operator' },
  { label: ',',      value: ',',          category: 'operator' },
  // Fila 7 — Números
  { label: '7',      value: '7',          category: 'number'   },
  { label: '8',      value: '8',          category: 'number'   },
  { label: '9',      value: '9',          category: 'number'   },
  { label: '(',      value: '(',          category: 'operator' },
  { label: '×',      value: '*',          category: 'operator' },
  // Fila 8
  { label: '4',      value: '4',          category: 'number'   },
  { label: '5',      value: '5',          category: 'number'   },
  { label: '6',      value: '6',          category: 'number'   },
  { label: ')',      value: ')',          category: 'operator' },
  { label: '-',      value: '-',          category: 'operator' },
  // Fila 9
  { label: '1',      value: '1',          category: 'number'   },
  { label: '2',      value: '2',          category: 'number'   },
  { label: '3',      value: '3',          category: 'number'   },
  { label: '^',      value: '^',          category: 'operator' },
  { label: '+',      value: '+',          category: 'operator' },
  // Fila 10
  { label: '0',      value: '0',          category: 'number', span: 2 },
  { label: '.',      value: '.',          category: 'number'   },
  { label: 'E',      value: 'E',          category: 'function' },
  { label: '=',      value: '=',          category: 'action'   },
];

// ─── Estilos ─────────────────────────────────────────────────────────────────

function btnBase(compact: boolean): string {
  return `flex items-center justify-center rounded-xl font-mono transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed select-none cursor-pointer ${compact ? 'min-h-[32px]' : 'h-full min-h-[36px]'}`;
}

function keyClass(key: KeyDef, compact: boolean): string {
  const b = btnBase(compact);
  const sz = compact ? 'text-[9px]' : 'text-[10px]';
  const szNum = compact ? 'text-xs' : 'text-sm';

  switch (key.category) {
    case 'function':
      return `${b} bg-(--color-surface-high) text-(--color-primary) ${sz} uppercase tracking-wide hover:brightness-110`;
    case 'number':
      return `${b} bg-(--color-surface-mid) text-(--color-on-surface) ${szNum} hover:bg-(--color-surface-high)`;
    case 'operator':
      return `${b} bg-(--color-primary-cta)/20 text-(--color-primary) ${szNum} hover:bg-(--color-primary-cta)/35`;
    case 'action':
      if (key.value === '=') {
        return `${b} bg-(--color-primary-cta) text-white ${szNum} font-bold shadow-[0_2px_12px_rgba(37,99,235,0.35)] hover:brightness-110`;
      }
      return `${b} bg-(--color-error)/10 text-(--color-error) ${sz} hover:bg-(--color-error)/20`;
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function CalculatorKeypad({
  onKeyPress,
  angleMode = 'RAD',
  disabled = false,
}: CalculatorKeypadProps) {
  const [expanded, setExpanded] = useState(false);

  const keys = expanded ? KEYS_EXPANDED : KEYS_BASIC;
  const cols = expanded ? 5 : 7;

  return (
    <div role="group" className="flex flex-col gap-1.5 p-2 bg-(--color-surface-low) rounded-xl border border-(--color-outline)/20 flex-1 min-h-0">

      {/* Barra superior: RAD/DEG + Toggle */}
      <div className="flex items-center gap-1">
        {(['RAD', 'DEG'] as const).map((mode) => {
          const isActive = mode === angleMode;
          return (
            <button
              key={mode}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                isActive
                  ? 'bg-(--color-primary-cta) text-white shadow-lg'
                  : 'bg-(--color-surface-high) text-(--color-on-surface-dim) hover:text-(--color-on-surface)'
              }`}
              onClick={() => onKeyPress(`MODE_${mode}`)}
              disabled={disabled}
              aria-pressed={isActive}
            >
              {mode}
            </button>
          );
        })}
        <div className="flex-1" />
        <button
          onClick={() => setExpanded(prev => !prev)}
          disabled={disabled}
          className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
            expanded
              ? 'bg-(--color-primary-cta)/20 text-(--color-primary) border border-(--color-primary-cta)/40'
              : 'bg-(--color-surface-high) text-(--color-on-surface-dim) hover:text-(--color-on-surface)'
          }`}
          title={expanded ? 'Basic mode' : 'Scientific mode'}
        >
          {expanded ? '▾ SCI' : '▸ SCI'}
        </button>
      </div>

      {/* Grid dinámico */}
      <div
        className="flex-1 min-h-0"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: expanded ? '3px' : '6px',
        }}
      >
        {keys.map((key, i) => (
          <button
            key={`${expanded ? 'e' : 'b'}-${i}`}
            className={keyClass(key, expanded)}
            style={key.span ? { gridColumn: `span ${key.span}` } : undefined}
            onClick={() => onKeyPress(key.value)}
            disabled={disabled}
          >
            {/[π∛]/.test(key.label)
              ? <span className="font-serif text-[1.2em]">{key.label}</span>
              : key.label}
          </button>
        ))}
      </div>

    </div>
  );
}
