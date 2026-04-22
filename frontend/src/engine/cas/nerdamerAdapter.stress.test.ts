import { all, create } from 'mathjs';
import { describe, expect, it } from 'vitest';
import { nerdamerAdapter } from './nerdamerAdapter';

const math = create(all);

function evaluateWithX(expr: string, x: number): number {
  const result = math.evaluate(expr, { x });
  if (typeof result !== 'number') {
    throw new Error(`Expected numeric result for "${expr}", received ${String(result)}`);
  }
  return result;
}

function evaluateWithoutScope(expr: string): number {
  const result = math.evaluate(expr);
  if (typeof result !== 'number') {
    throw new Error(`Expected numeric result for "${expr}", received ${String(result)}`);
  }
  return result;
}

function finiteDerivative(expr: string, x: number, h = 1e-6): number {
  return (evaluateWithX(expr, x + h) - evaluateWithX(expr, x - h)) / (2 * h);
}

function expectEquivalent(actual: string, expected: string, samples: number[]): void {
  for (const x of samples) {
    expect(evaluateWithX(actual, x)).toBeCloseTo(evaluateWithX(expected, x), 8);
  }
}

function expectDerivativeMatches(actualDerivative: string, originalExpr: string, samples: number[]): void {
  for (const x of samples) {
    expect(evaluateWithX(actualDerivative, x)).toBeCloseTo(finiteDerivative(originalExpr, x), 5);
  }
}

function expectAntiderivativeMatches(actualAntiderivative: string, integrand: string, samples: number[]): void {
  for (const x of samples) {
    expect(finiteDerivative(actualAntiderivative, x)).toBeCloseTo(evaluateWithX(integrand, x), 5);
  }
}

function parseSolutionList(raw: string): string[] {
  const trimmed = raw.trim();
  expect(trimmed.startsWith('[')).toBe(true);
  expect(trimmed.endsWith(']')).toBe(true);
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) return [];
  return inner.split(',').map((entry) => entry.trim()).filter(Boolean);
}

function equationToExpression(equation: string): string {
  const [lhs, rhs] = equation.split('=').map((part) => part.trim());
  if (!rhs) return lhs;
  return `(${lhs}) - (${rhs})`;
}

describe('nerdamerAdapter stress', () => {
  it('simplifica x + x a una expresion equivalente a 2*x', async () => {
    const result = await nerdamerAdapter.simplify('x + x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expectEquivalent(result.result, '2*x', [-5, -1, 0, 1, 3]);
    }
  });

  it('simplifica la identidad sin(x)^2 + cos(x)^2 a 1', async () => {
    const result = await nerdamerAdapter.simplify('sin(x)^2 + cos(x)^2');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expectEquivalent(result.result, '1', [-2, -1, 0, 1, 2]);
    }
  });

  it('simplifica una cancelacion racional complicada', async () => {
    const result = await nerdamerAdapter.simplify('(x^2 - 1)/(x - 1)');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expectEquivalent(result.result, 'x + 1', [-3, -0.5, 0, 2, 4]);
    }
  });

  it('deriva un polinomio de alto grado con buena precision', async () => {
    const original = 'x^5 - 3*x^2 + 7*x - 11';
    const result = await nerdamerAdapter.differentiate(original, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expectDerivativeMatches(result.result, original, [-2, -1, 0, 1, 2]);
    }
  });

  it('deriva correctamente un producto trigonometrico', async () => {
    const original = 'sin(x)*cos(x)';
    const result = await nerdamerAdapter.differentiate(original, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expectDerivativeMatches(result.result, original, [-1.4, -0.7, 0, 0.8, 1.2]);
    }
  });

  it('deriva correctamente una cadena algebraica', async () => {
    const original = '(x^2 + 1)^3';
    const result = await nerdamerAdapter.differentiate(original, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expectDerivativeMatches(result.result, original, [-2, -1, 0, 1, 2]);
    }
  });

  it('calcula la segunda derivada de x^4', async () => {
    const result = await nerdamerAdapter.differentiate('x^4', 'x', 2);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expectEquivalent(result.result, '12*x^2', [-3, -1, 0, 1, 3]);
    }
  });

  it('integra un polinomio y su derivada numerica recupera el integrando', async () => {
    const integrand = '3*x^2 + 4*x + 5';
    const result = await nerdamerAdapter.integrate(integrand, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expectAntiderivativeMatches(result.result, integrand, [-2, -1, 0, 1, 2]);
    }
  });

  it('integra cos(x) y la derivada numerica recupera cos(x)', async () => {
    const integrand = 'cos(x)';
    const result = await nerdamerAdapter.integrate(integrand, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expectAntiderivativeMatches(result.result, integrand, [-1.5, -0.5, 0.5, 1, 2]);
    }
  });

  it('integra una expresion de cadena con alta variacion', async () => {
    const integrand = '6*x*(x^2 + 1)^2';
    const result = await nerdamerAdapter.integrate(integrand, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expectAntiderivativeMatches(result.result, integrand, [-1.5, -0.75, 0, 0.75, 1.5]);
    }
  });

  it('resuelve una cuadratica y cada raiz anula la ecuacion', async () => {
    const equation = 'x^2 - 5*x + 6 = 0';
    const result = await nerdamerAdapter.solveEquation(equation, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const roots = parseSolutionList(result.result).map(evaluateWithoutScope).sort((a, b) => a - b);
      expect(roots).toEqual([2, 3]);
      for (const root of roots) {
        expect(Math.abs(evaluateWithX(equationToExpression(equation), root))).toBeLessThan(1e-8);
      }
    }
  });

  it('resuelve un cubico con tres raices reales', async () => {
    const equation = 'x^3 - 6*x^2 + 11*x - 6 = 0';
    const result = await nerdamerAdapter.solveEquation(equation, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const roots = parseSolutionList(result.result).map(evaluateWithoutScope).sort((a, b) => a - b);
      expect(roots).toEqual([1, 2, 3]);
      for (const root of roots) {
        expect(Math.abs(evaluateWithX(equationToExpression(equation), root))).toBeLessThan(1e-8);
      }
    }
  });

  it('resuelve una ecuacion lineal con raiz decimal exacta', async () => {
    const equation = '2*x + 7 = 0';
    const result = await nerdamerAdapter.solveEquation(equation, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const roots = parseSolutionList(result.result).map(evaluateWithoutScope);
      expect(roots).toHaveLength(1);
      expect(roots[0]).toBeCloseTo(-3.5, 10);
      expect(Math.abs(evaluateWithX(equationToExpression(equation), roots[0]))).toBeLessThan(1e-8);
    }
  });

  it('resuelve una cuadratica simetrica con dos raices opuestas', async () => {
    const equation = 'x^2 - 16 = 0';
    const result = await nerdamerAdapter.solveEquation(equation, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const roots = parseSolutionList(result.result).map(evaluateWithoutScope).sort((a, b) => a - b);
      expect(roots).toEqual([-4, 4]);
      for (const root of roots) {
        expect(Math.abs(evaluateWithX(equationToExpression(equation), root))).toBeLessThan(1e-8);
      }
    }
  });

  it('expande (x + 1)^5 preservando equivalencia numerica', async () => {
    const original = '(x + 1)^5';
    const result = await nerdamerAdapter.expand(original);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expectEquivalent(result.result, original, [-3, -1, 0, 1, 2]);
    }
  });

  it('expande un producto binomico no simetrico', async () => {
    const original = '(2*x - 3)*(x + 4)';
    const result = await nerdamerAdapter.expand(original);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expectEquivalent(result.result, original, [-4, -1, 0, 1.5, 3]);
    }
  });

  it('factoriza x^2 - 9 sin alterar su valor numerico', async () => {
    const original = 'x^2 - 9';
    const result = await nerdamerAdapter.factor(original);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expectEquivalent(result.result, original, [-5, -2, 0, 2, 5]);
    }
  });

  it('factoriza un cubico con tres factores reales', async () => {
    const original = 'x^3 - 3*x^2 + 2*x';
    const result = await nerdamerAdapter.factor(original);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expectEquivalent(result.result, original, [-2, -1, 0, 1.5, 4]);
    }
  });

  it('devuelve error ante una simplificacion malformada', async () => {
    const result = await nerdamerAdapter.simplify('x +');
    expect(result.status).toBe('error');
  });

  it('devuelve error ante una ecuacion malformada', async () => {
    const result = await nerdamerAdapter.solveEquation('((x + 1)', 'x');
    expect(result.status).toBe('error');
  });
});
