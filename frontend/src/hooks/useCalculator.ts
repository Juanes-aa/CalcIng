import { useState, useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { evaluate, type AngleMode } from '@engine/mathEngine';
import {
  type HistoryEntry,
  loadHistory, saveHistory, createEntry,
} from '@engine/historial';
import { useSettings } from './useSettings';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface CalculatorState {
  expression:    string;
  result:        string;
  isError:       boolean;
  angleMode:     AngleMode;
  history:       HistoryEntry[];
  setHistory:    Dispatch<SetStateAction<HistoryEntry[]>>;
  setExpression: Dispatch<SetStateAction<string>>;
  handleKeyPress: (key: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Tokens válidos que el keypad puede anexar a la expresión. */
const APPENDABLE_TOKENS = new Set([
  // Números
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  // Operadores
  '+', '-', '*', '/', '%', '^', '^2', '^3', '^(-1)', '(', ')',
  // Punto decimal
  '.',
  // Coma — necesaria para funciones con múltiples argumentos: mean(1,2,3)
  ',',
  // Constante e (Euler) y notación exponencial
  'e', 'E',
  // Funciones básicas
  'sin(', 'cos(', 'tan(', 'log(', 'ln(', 'sqrt(', 'pi',
  // Trigonometría inversa
  'asin(', 'acos(', 'atan(',
  // Hiperbólicas
  'sinh(', 'cosh(', 'tanh(',
  // Potencias y raíces
  'exp(', 'cbrt(',
  // Funciones matemáticas adicionales
  'abs(', 'ceil(', 'floor(', 'round(', 'factorial(', 'mod(', 'sign(',
  // Estadística (registradas en mathEngine via _registrarFuncionesExtendidas)
  'mean(', 'median(', 'mode(', 'variance(', 'stdDev(', 'range(',
  // Conversión de bases (registradas en mathEngine)
  'decToBin(', 'decToHex(', 'decToOct(', 'nCr(', 'nPr(',
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

  const { precision, sciNotation } = useSettings();

  // Refs para re-evaluar al cambiar precisión/sciNotation sin perder el estado actual.
  const expressionRef = useRef(expression);
  const resultRef     = useRef(result);
  const isErrorRef    = useRef(isError);
  const angleModeRef  = useRef(angleMode);
  useEffect(() => { expressionRef.current = expression; }, [expression]);
  useEffect(() => { resultRef.current     = result;     }, [result]);
  useEffect(() => { isErrorRef.current    = isError;    }, [isError]);
  useEffect(() => { angleModeRef.current  = angleMode;  }, [angleMode]);

  // Re-evalúa la expresión activa cuando cambia precisión o notación científica.
  useEffect(() => {
    const expr = expressionRef.current;
    if (!expr || !resultRef.current || isErrorRef.current) return;
    const res = evaluate(expr, angleModeRef.current);
    setResult(res);
    setIsError(deriveIsError(res));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precision, sciNotation]);

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

    if (key === 'ANS') {
      const last = resultRef.current;
      if (last && !deriveIsError(last)) setExpression((prev: string) => prev + last);
      return;
    }

    if (key === 'NEGATE') {
      setExpression((prev: string) => {
        if (!prev) return '-';
        return prev.startsWith('-') ? prev.slice(1) : `-${prev}`;
      });
      return;
    }

    if (key === 'RAND') {
      setExpression((prev: string) => prev + Math.random().toFixed(6));
      return;
    }

    // ── Tokens appendeables — solo concatenar tokens explícitamente válidos ───
    //
    // Cualquier token que no esté en APPENDABLE_TOKENS se descarta
    // silenciosamente. Esto protege contra tokens futuros del Keypad
    // que lleguen antes de ser implementados aquí.

    if (APPENDABLE_TOKENS.has(key)) {
      setExpression((prev: string) => prev + key);
    } else if (key.length === 1 && /[a-zA-Z0-9+\-*/.^%(),!_ ]/.test(key)) {
      setExpression((prev: string) => prev + key);
    }

  }, [angleMode]);

  return { expression, result, isError, angleMode, history, setHistory, setExpression, handleKeyPress };
}