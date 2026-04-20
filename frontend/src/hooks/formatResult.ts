import type { CASOperation } from './useCAS';

/**
 * Ordena los términos de un polinomio de mayor a menor grado.
 * Ejemplo: "1+2*x+x^2" → "x^2+2*x+1"
 */
function sortPolynomialTerms(expr: string): string {
  // Solo aplica si parece un polinomio simple (contiene + o -)
  // Separar respetando signos
  const terms = expr
    .replace(/\s+/g, '')
    .split(/(?=[+-])/)
    .filter(Boolean);

  if (terms.length <= 1) return expr;

  // Calcular el "grado" de cada término para ordenar
  function degree(term: string): number {
    const match = term.match(/\^(\d+)/);
    if (match) return parseInt(match[1], 10);
    if (/[a-zA-Z]/.test(term)) return 1;
    return 0;
  }

  const sorted = [...terms].sort((a, b) => degree(b) - degree(a));
  const result = sorted.join('');

  // Asegurar que no empiece con '+'
  return result.startsWith('+') ? result.slice(1) : result;
}

/**
 * Formatea soluciones de ecuaciones.
 * Ejemplo: "[-1]" → "x = -1"
 *          "[2,-2]" → "x = 2, x = -2"
 */
function formatSolutions(raw: string, variable: string): string {
  const trimmed = raw.trim();

  // Detectar formato array de nerdamer: [val1,val2,...]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();

    if (inner === '') return 'Sin solución real';

    const solutions = inner.split(',').map(s => s.trim()).filter(Boolean);

    if (solutions.length === 1) {
      return `${variable} = ${solutions[0]}`;
    }

    return solutions.map(s => `${variable} = ${s}`).join(',  ');
  }

  return raw;
}

/**
 * Formatea el resultado crudo de nerdamer para mostrarlo de forma
 * legible según la operación ejecutada.
 */
export function formatResult(
  raw: string,
  operation: CASOperation,
  variable: string,
): string {
  if (!raw || raw.trim() === '') return raw;

  switch (operation) {
    case 'solveEquation':
      return formatSolutions(raw, variable);

    case 'simplify':
    case 'expand':
    case 'factor':
    case 'differentiate':
    case 'integrate':
      return sortPolynomialTerms(raw);

    default:
      return raw;
  }
}