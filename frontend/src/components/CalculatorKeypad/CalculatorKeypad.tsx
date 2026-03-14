import styles from './CalculatorKeypad.module.css';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type KeyCategory = 'number' | 'operator' | 'function' | 'action' | 'mode';

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

// ─── Mapa de teclas ───────────────────────────────────────────────────────────
//
// Orden: define el layout visual de arriba a abajo, izquierda a derecha.
// El CSS grid se encarga de la disposición; aquí solo declaramos qué existe.

const KEYS: KeyDef[] = [
  // Fila 0 — modos de ángulo
  { label: 'RAD',  value: 'MODE_RAD',  category: 'mode' },
  { label: 'DEG',  value: 'MODE_DEG',  category: 'mode' },

  // Fila 1 — funciones científicas
  { label: 'sin',  value: 'sin(',      category: 'function' },
  { label: 'cos',  value: 'cos(',      category: 'function' },
  { label: 'tan',  value: 'tan(',      category: 'function' },
  { label: 'log',  value: 'log(',      category: 'function' },

  // Fila 2 — funciones científicas II
  { label: 'ln',   value: 'ln(',       category: 'function' },
  { label: '√',    value: 'sqrt(',     category: 'function' },
  { label: 'xʸ',   value: '^',         category: 'function' },
  { label: 'π',    value: 'pi',        category: 'function' },

  // Fila 3 — acciones y paréntesis
  { label: 'C',    value: 'CLEAR',     category: 'action' },
  { label: '⌫',    value: 'BACKSPACE', category: 'action' },
  { label: '(',    value: '(',         category: 'operator' },
  { label: ')',    value: ')',         category: 'operator' },

  // Fila 4 — dígitos y operadores (layout clásico 4×4)
  { label: '7',    value: '7',         category: 'number' },
  { label: '8',    value: '8',         category: 'number' },
  { label: '9',    value: '9',         category: 'number' },
  { label: '÷',    value: '/',         category: 'operator' },

  { label: '4',    value: '4',         category: 'number' },
  { label: '5',    value: '5',         category: 'number' },
  { label: '6',    value: '6',         category: 'number' },
  { label: '×',    value: '*',         category: 'operator' },

  { label: '1',    value: '1',         category: 'number' },
  { label: '2',    value: '2',         category: 'number' },
  { label: '3',    value: '3',         category: 'number' },
  { label: '-',    value: '-',         category: 'operator' },

  { label: '0',    value: '0',         category: 'number' },
  { label: '.',    value: '.',         category: 'number' },
  { label: '=',    value: '=',         category: 'action' },
  { label: '+',    value: '+',         category: 'operator' },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export function CalculatorKeypad({
  onKeyPress,
  angleMode = 'RAD',
  disabled = false,
}: CalculatorKeypadProps) {
  return (
    <div role="group" className={styles.keypad}>
      {KEYS.map((key) => {
        const isActiveMode =
          key.category === 'mode' &&
          key.label === angleMode;

        return (
          <button
            key={key.label}
            className={`${styles.key} ${styles[key.category]}${isActiveMode ? ` ${styles.active}` : ''}`}
            onClick={() => onKeyPress(key.value)}
            disabled={disabled}
            aria-pressed={key.category === 'mode' ? isActiveMode : undefined}
          >
            {key.label}
          </button>
        );
      })}
    </div>
  );
}
