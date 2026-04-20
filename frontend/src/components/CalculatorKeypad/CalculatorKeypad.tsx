// ─── Tipos ────────────────────────────────────────────────────────────────────

type KeyCategory = 'number' | 'operator' | 'function' | 'action';

interface KeyDef {
  label: string;   // Lo que ve el usuario
  value: string;   // Lo que recibe el padre / engine
  category: KeyCategory;
}

export interface CalculatorKeypadProps {
  onKeyPress: (key: string) => void;
  angleMode?: 'RAD' | 'DEG' | 'GRAD';
  disabled?: boolean;
}

// ─── Mapa de teclas — layout 7 columnas ───────────────────────────────────────

const KEYS: KeyDef[] = [
  // Fila 1 — funciones científicas
  { label: 'sin',   value: 'sin(',       category: 'function' },
  { label: 'cos',   value: 'cos(',       category: 'function' },
  { label: 'tan',   value: 'tan(',       category: 'function' },
  { label: 'log',   value: 'log(',       category: 'function' },
  { label: 'ln',    value: 'ln(',        category: 'function' },
  { label: '√',     value: 'sqrt(',      category: 'function' },
  { label: 'x²',    value: '^2',         category: 'function' },
  // Fila 2 — constantes y acciones
  { label: 'π',     value: 'pi',         category: 'function' },
  { label: 'e',     value: 'e',          category: 'function' },
  { label: '(',     value: '(',          category: 'operator' },
  { label: ')',     value: ')',          category: 'operator' },
  { label: 'DEL',   value: 'BACKSPACE',  category: 'action'   },
  { label: 'AC',    value: 'CLEAR',      category: 'action'   },
  { label: 'x!',    value: 'factorial(', category: 'function' },
  // Fila 3 — dígitos + operadores avanzados
  { label: '7',     value: '7',          category: 'number'   },
  { label: '8',     value: '8',          category: 'number'   },
  { label: '9',     value: '9',          category: 'number'   },
  { label: '/',     value: '/',          category: 'operator' },
  { label: 'MOD',   value: 'mod(',       category: 'function' },
  { label: 'EXP',   value: 'EXP',        category: 'function' },
  { label: 'ANS',   value: 'ANS',        category: 'function' },
  // Fila 4 — dígitos + funciones matemáticas
  { label: '4',     value: '4',          category: 'number'   },
  { label: '5',     value: '5',          category: 'number'   },
  { label: '6',     value: '6',          category: 'number'   },
  { label: '*',     value: '*',          category: 'operator' },
  { label: 'abs',   value: 'abs(',       category: 'function' },
  { label: 'ceil',  value: 'ceil(',      category: 'function' },
  { label: 'floor', value: 'floor(',     category: 'function' },
  // Fila 5 — dígitos + funciones matemáticas
  { label: '1',     value: '1',          category: 'number'   },
  { label: '2',     value: '2',          category: 'number'   },
  { label: '3',     value: '3',          category: 'number'   },
  { label: '-',     value: '-',          category: 'operator' },
  { label: 'rand',  value: 'RAND',       category: 'function' },
  { label: 'round', value: 'round(',     category: 'function' },
  { label: 'sign',  value: 'sign(',      category: 'function' },
  // Fila 6 — fila inferior
  { label: '0',     value: '0',          category: 'number'   },
  { label: '.',     value: '.',          category: 'number'   },
  { label: '=',     value: '=',          category: 'action'   },
  { label: '+',     value: '+',          category: 'operator' },
  { label: 'nCr',   value: 'nCr(',       category: 'function' },
  { label: 'nPr',   value: 'nPr(',       category: 'function' },
  { label: '%',     value: '%',          category: 'operator' },
];

// ─── Helpers de clase ─────────────────────────────────────────────────────────

const BASE = 'flex items-center justify-center rounded-xl font-mono transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed select-none cursor-pointer h-full min-h-[36px]';

function keyClass(key: KeyDef): string {
  switch (key.category) {
    case 'function':
      return `${BASE} bg-(--color-surface-high) text-(--color-primary) text-[10px] uppercase tracking-wide hover:brightness-110`;
    case 'number':
      return `${BASE} bg-(--color-surface-mid) text-(--color-on-surface) text-sm hover:bg-(--color-surface-high)`;
    case 'operator':
      return `${BASE} bg-(--color-primary-cta)/20 text-(--color-primary) text-sm hover:bg-(--color-primary-cta)/35`;
    case 'action':
      if (key.value === '=') {
        return `${BASE} bg-(--color-primary-cta) text-white text-sm font-bold shadow-[0_2px_12px_rgba(37,99,235,0.35)] hover:brightness-110`;
      }
      return `${BASE} bg-(--color-error)/10 text-(--color-error) text-[10px] hover:bg-(--color-error)/20`;
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function CalculatorKeypad({
  onKeyPress,
  angleMode = 'RAD',
  disabled = false,
}: CalculatorKeypadProps) {
  return (
    <div role="group" className="flex flex-col gap-1.5 p-2 bg-(--color-surface-low) rounded-xl border border-(--color-outline)/20 flex-1 min-h-0">

      {/* Barra RAD / DEG */}
      <div className="flex items-center gap-1">
        {(['RAD', 'DEG'] as const).map((mode) => {
          const isActive = mode === angleMode;
          return (
            <button
              key={mode}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                isActive
                  ? 'bg-(--color-primary-cta) text-white shadow-lg active'
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
      </div>

      {/* Grid 7 columnas */}
      <div className="grid grid-cols-7 grid-rows-6 gap-2 flex-1">
        {KEYS.map((key) => (
          <button
            key={key.label}
            className={keyClass(key)}
            onClick={() => onKeyPress(key.value)}
            disabled={disabled}
          >
            {key.label}
          </button>
        ))}
      </div>

    </div>
  );
}
