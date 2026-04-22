import { all, create } from 'mathjs';
import { describe, expect, it } from 'vitest';
import { nerdamerAdapter } from './nerdamerAdapter';

const math = create(all);

function normalizeForMathjs(expr: string): string {
  return expr.replace(/\bln\(/g, 'log(');
}

function evalAt(expr: string, x: number): number {
  const value = math.evaluate(normalizeForMathjs(expr), { x });
  if (typeof value !== 'number') throw new Error(`Expected numeric result for ${expr}`);
  return value;
}

function evalPlain(expr: string): number {
  const value = math.evaluate(normalizeForMathjs(expr));
  if (typeof value !== 'number') throw new Error(`Expected numeric result for ${expr}`);
  return value;
}

function centralDerivative(expr: string, x: number, h = 1e-6): number {
  return (evalAt(expr, x + h) - evalAt(expr, x - h)) / (2 * h);
}

function assertEquivalent(actual: string, expected: string, samples: number[]): void {
  for (const x of samples) {
    expect(evalAt(actual, x)).toBeCloseTo(evalAt(expected, x), 7);
  }
}

describe('nerdamerAdapter extreme', () => {
  it('simplifica una fraccion racional compleja de forma equivalente', async () => {
    const result = await nerdamerAdapter.simplify('(x^3 - x)/x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      assertEquivalent(result.result, 'x^2 - 1', [-4, -2, -1, 1, 3]);
    }
  });

  it('simplifica exp(ln(x)) de forma equivalente para x positivo', async () => {
    const result = await nerdamerAdapter.simplify('exp(ln(x))');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      assertEquivalent(result.result, 'x', [0.5, 1, 2, 4, 7]);
    }
  });

  it('simplifica un cociente cancelable de forma estable', async () => {
    const result = await nerdamerAdapter.simplify('(x^2 + 2*x + 1)/(x + 1)');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      assertEquivalent(result.result, 'x + 1', [-5, -2, 0, 1, 3]);
    }
  });

  it('deriva exp(sin(x^2)) con coherencia numerica', async () => {
    const original = 'exp(sin(x^2))';
    const result = await nerdamerAdapter.differentiate(original, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      for (const x of [-1.5, -0.8, 0, 0.9, 1.6]) {
        expect(evalAt(result.result, x)).toBeCloseTo(centralDerivative(original, x), 5);
      }
    }
  });

  it('deriva ln(x^2 + 1) con coherencia numerica', async () => {
    const original = 'ln(x^2 + 1)';
    const result = await nerdamerAdapter.differentiate(original, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      for (const x of [-2, -1, 0, 1, 2]) {
        expect(evalAt(result.result, x)).toBeCloseTo(centralDerivative(original, x), 5);
      }
    }
  });

  it('deriva un producto algebraico-trigonometrico pesado', async () => {
    const original = 'x^2*cos(x)';
    const result = await nerdamerAdapter.differentiate(original, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      for (const x of [-2, -1, -0.25, 1, 2]) {
        expect(evalAt(result.result, x)).toBeCloseTo(centralDerivative(original, x), 5);
      }
    }
  });

  it('deriva un cociente no trivial con buena aproximacion', async () => {
    const original = '(x^2 + 1)/(x - 1)';
    const result = await nerdamerAdapter.differentiate(original, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      for (const x of [-2, -0.5, 0, 2, 3]) {
        expect(evalAt(result.result, x)).toBeCloseTo(centralDerivative(original, x), 5);
      }
    }
  });

  it('calcula segunda derivada de sin(x^2) con consistencia numerica', async () => {
    const first = await nerdamerAdapter.differentiate('sin(x^2)', 'x');
    expect(first.status).toBe('success');
    if (first.status === 'success') {
      const second = await nerdamerAdapter.differentiate(first.result, 'x');
      expect(second.status).toBe('success');
      if (second.status === 'success') {
        for (const x of [-1.2, -0.4, 0.3, 1.1, 2]) {
          expect(evalAt(second.result, x)).toBeCloseTo(centralDerivative(first.result, x), 4);
        }
      }
    }
  });

  it('integra sin(x) y recupera el integrando por derivacion numerica', async () => {
    const integrand = 'sin(x)';
    const result = await nerdamerAdapter.integrate(integrand, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      for (const x of [-2, -1, 0, 1, 2]) {
        expect(centralDerivative(result.result, x)).toBeCloseTo(evalAt(integrand, x), 5);
      }
    }
  });

  it('integra 1/x en dominio positivo con coherencia numerica', async () => {
    const integrand = '1/x';
    const result = await nerdamerAdapter.integrate(integrand, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      for (const x of [0.5, 1, 2, 3, 5]) {
        expect(centralDerivative(result.result, x)).toBeCloseTo(evalAt(integrand, x), 5);
      }
    }
  });

  it('integra exp(2*x) con coherencia numerica', async () => {
    const integrand = 'exp(2*x)';
    const result = await nerdamerAdapter.integrate(integrand, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      for (const x of [-1, -0.2, 0.5, 1, 1.5]) {
        expect(centralDerivative(result.result, x)).toBeCloseTo(evalAt(integrand, x), 5);
      }
    }
  });

  it('integra x*cos(x) con coherencia numerica', async () => {
    const integrand = 'x*cos(x)';
    const result = await nerdamerAdapter.integrate(integrand, 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      for (const x of [-2, -1, 0, 1, 2]) {
        expect(centralDerivative(result.result, x)).toBeCloseTo(evalAt(integrand, x), 5);
      }
    }
  });

  it('resuelve x^2 - 2 = 0 con raices de magnitud sqrt(2)', async () => {
    const result = await nerdamerAdapter.solveEquation('x^2 - 2 = 0', 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const roots = result.result.slice(1, -1).split(',').map((value) => evalPlain(value.trim())).sort((a, b) => a - b);
      expect(roots[0]).toBeCloseTo(-Math.sqrt(2), 8);
      expect(roots[1]).toBeCloseTo(Math.sqrt(2), 8);
    }
  });

  it('resuelve x^2 + x - 6 = 0 con dos raices reales', async () => {
    const result = await nerdamerAdapter.solveEquation('x^2 + x - 6 = 0', 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const roots = result.result.slice(1, -1).split(',').map((value) => evalPlain(value.trim())).sort((a, b) => a - b);
      expect(roots).toEqual([-3, 2]);
    }
  });

  it('resuelve 0.5*x - 1 = 0 con raiz decimal exacta', async () => {
    const result = await nerdamerAdapter.solveEquation('0.5*x - 1 = 0', 'x');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const roots = result.result.slice(1, -1).split(',').map((value) => evalPlain(value.trim()));
      expect(roots).toEqual([2]);
    }
  });

  it('expande (x - 2)^4 manteniendo equivalencia numerica', async () => {
    const original = '(x - 2)^4';
    const result = await nerdamerAdapter.expand(original);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      assertEquivalent(result.result, original, [-3, -1, 0, 2, 5]);
    }
  });

  it('expande un producto triple manteniendo equivalencia numerica', async () => {
    const original = '(x+1)*(x+2)*(x+3)';
    const result = await nerdamerAdapter.expand(original);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      assertEquivalent(result.result, original, [-4, -2, 0, 1, 3]);
    }
  });

  it('factoriza x^4 - 1 preservando equivalencia numerica', async () => {
    const original = 'x^4 - 1';
    const result = await nerdamerAdapter.factor(original);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      assertEquivalent(result.result, original, [-3, -1, 0, 1, 2]);
    }
  });

  it('factoriza un cuadrado perfecto pesado', async () => {
    const original = '4*x^2 - 12*x + 9';
    const result = await nerdamerAdapter.factor(original);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      assertEquivalent(result.result, original, [-2, 0, 1, 2, 5]);
    }
  });

  it('mantiene manejo de error en integrales malformadas', async () => {
    const result = await nerdamerAdapter.integrate('x +', 'x');
    expect(result.status).toBe('error');
  });

  it('mantiene manejo de error en factorizacion malformada', async () => {
    const result = await nerdamerAdapter.factor('@#$');
    expect(result.status).toBe('error');
  });
});
