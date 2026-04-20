import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import { evaluate, type AngleMode } from '@engine/mathEngine';
import {
  type HistoryEntry,
  loadHistory, saveHistory, createEntry,
} from '@engine/historial';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface CalculatorState {
  expression: string;
  result:     string;
  isError:    boolean;
  angleMode:  AngleMode;
  history:    HistoryEntry[];
  setHistory: Dispatch<SetStateAction<HistoryEntry[]>>;
  handleKeyPress: (key: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Tokens válidos que el keypad puede anexar a la expresión. */
const APPENDABLE_TOKENS = new Set([
  // Números
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  // Operadores
  '+', '-', '*', '/', '%', '^', '^2', '(', ')',
  // Punto decimal
  '.',
  // Coma — necesaria para funciones con múltiples argumentos: mean(1,2,3)
  ',',
  // Constante e (Euler)
  'e',
  // Funciones básicas
  'sin(', 'cos(', 'tan(', 'log(', 'ln(', 'sqrt(', 'pi',
  // Funciones matemáticas adicionales
  'abs(', 'ceil(', 'floor(', 'round(', 'factorial(', 'mod(',
  // Estadística (registradas en mathEngine via _registrarFuncionesExtendidas)
  'mean(', 'median(', 'mode(', 'variance(', 'stdDev(', 'range(',
  // Conversión de bases (registradas en mathEngine)
  'decToBin(', 'decToHex(', 'decToOct(',
]);

/** Determina si el resultado del engine representa un error. */
function deriveIsError(result: string): boolean {
  return result.startsWith('Error') || result === 'Indefinido';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCalculator(): CalculatorState {
  const [expression, setExpression] = useState('');
  const [result,     setResult]     = useState('');
  const [isError,    setIsError]    = useState(false);
  const [angleMode,  setAngleMode]  = useState<AngleMode>('RAD');
  const [history,    setHistory]    = useState<HistoryEntry[]>(loadHistory);

  const handleKeyPress = useCallback((key: string) => {

    // ── Acciones ──────────────────────────────────────────────────────────────

    if (key === 'CLEAR') {
      setExpression('');
      setResult('');
      setIsError(false);
      return;
    }

    if (key === 'BACKSPACE') {
      setExpression((prev: string) => prev.slice(0, -1));
      return;
    }

    if (key === '=') {
      setExpression((prev: string) => {
        if (!prev) return prev;
        const res = evaluate(prev, angleMode);
        setResult(res);
        const err = deriveIsError(res);
        setIsError(err);
        if (!err) {
          setHistory(hist => {
            const updated = [createEntry(prev, res, angleMode), ...hist];
            saveHistory(updated);
            return updated;
          });
        }
        return prev;
      });
      return;
    }

    if (key === 'MODE_RAD') { setAngleMode('RAD'); return; }
    if (key === 'MODE_DEG') { setAngleMode('DEG'); return; }
    if (key === 'MODE_GRAD') { setAngleMode('GRAD'); return; }

    // ── Tokens appendeables — solo concatenar tokens explícitamente válidos ───
    //
    // Cualquier token que no esté en APPENDABLE_TOKENS se descarta
    // silenciosamente. Esto protege contra tokens futuros del Keypad
    // que lleguen antes de ser implementados aquí.

    if (APPENDABLE_TOKENS.has(key)) {
      setExpression((prev: string) => prev + key);
    }

  }, [angleMode]);

  return { expression, result, isError, angleMode, history, setHistory, handleKeyPress };
}