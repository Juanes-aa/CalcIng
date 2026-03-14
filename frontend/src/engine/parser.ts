/**
 * parser.ts
 * Validador de entrada y tokenizador de expresiones para la capa de visualización.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ParenthesesResult {
  valid: boolean;
  message: string;
}

export type TokenType = 'numero' | 'operador' | 'funcion' | 'parentesis' | 'constante' | 'identificador';

export interface Token {
  tipo: TokenType;
  valor: string;
}

export interface HistoryItem {
  expresion: string;
  resultado: string;
  timestamp: number;
}

// ─── Validación ───────────────────────────────────────────────────────────────

export function checkParentheses(expr: string): ParenthesesResult {
  let profundidad = 0;
  for (const ch of expr) {
    if (ch === '(') profundidad++;
    else if (ch === ')') {
      profundidad--;
      if (profundidad < 0) return { valid: false, message: 'Paréntesis de cierre inesperado.' };
    }
  }
  if (profundidad !== 0) return { valid: false, message: `Faltan ${profundidad} paréntesis de cierre.` };
  return { valid: true, message: '' };
}

export function quickValidate(expr: string): string | null {
  if (!expr || expr.trim() === '') return 'Expresión vacía.';
  if (/[+\-*/^%]\s*$/.test(expr)) return 'La expresión termina con un operador.';
  if (/[+*/^%]{2,}/.test(expr)) return 'Operadores consecutivos detectados.';
  const pCheck = checkParentheses(expr);
  if (!pCheck.valid) return pCheck.message;
  return null;
}

// ─── Formateo para Pantalla ───────────────────────────────────────────────────

export function formatForDisplay(expr: string): string {
  return expr
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/\bpi\b/gi, 'π')
    .replace(/sqrt\(/g, '√(')
    .replace(/\bInfinity\b/g, '∞');
}

export function parseFromDisplay(exprPantalla: string): string {
  return exprPantalla
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi')
    .replace(/√\(/g, 'sqrt(')
    .replace(/∞/g, 'Infinity');
}

// ─── Tokenizador ─────────────────────────────────────────────────────────────

export function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  const re = /(\d+\.?\d*(?:e[+-]?\d+)?)|([a-zA-Z_][a-zA-Z0-9_]*)|([+\-*/^%])|([()])|([\s.]+)/g;
  let match: RegExpExecArray | null;

  const FUNCIONES_CONOCIDAS = new Set([
    'sin','cos','tan','asin','acos','atan','sinh','cosh','tanh',
    'log','log10','log2','ln','exp','sqrt','cbrt','abs','ceil','floor','round',
    'sign','factorial','nthRoot','pow','mod',
  ]);

  const CONSTANTES_CONOCIDAS = new Set(['pi','e','phi','c','g','h','hbar','kb','na']);

  while ((match = re.exec(expr)) !== null) {
    const [, num, palabra, op, paren] = match;
    if (num)     tokens.push({ tipo: 'numero',     valor: num });
    else if (palabra) {
      const lower = palabra.toLowerCase();
      if (FUNCIONES_CONOCIDAS.has(lower))       tokens.push({ tipo: 'funcion',       valor: palabra });
      else if (CONSTANTES_CONOCIDAS.has(lower)) tokens.push({ tipo: 'constante',     valor: palabra });
      else                                       tokens.push({ tipo: 'identificador', valor: palabra });
    }
    else if (op)    tokens.push({ tipo: 'operador',   valor: op });
    else if (paren) tokens.push({ tipo: 'parentesis', valor: paren });
  }

  return tokens;
}

// ─── Gestión del Historial ────────────────────────────────────────────────────

const MAX_HISTORIAL = 50;

export class CalculationHistory {
  private _items: HistoryItem[] = [];

  push(expresion: string, resultado: string): void {
    this._items.unshift({ expresion, resultado, timestamp: Date.now() });
    if (this._items.length > MAX_HISTORIAL) this._items.pop();
  }

  get items(): HistoryItem[] { return [...this._items]; }
  clear(): void              { this._items = []; }
  getLast(n = 1): HistoryItem[] { return this._items.slice(0, n); }
}
