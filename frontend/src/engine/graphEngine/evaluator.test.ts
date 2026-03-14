import { describe, it, expect } from 'vitest';
import { evaluatePoint, adaptiveSample, sampleParametric, samplePolar } from './evaluator';
import type { Point } from './evaluator';

describe('evaluatePoint', () => {
  // Evaluación básica
  it('evalúa x^2 en x=3 → 9', () => {
    expect(evaluatePoint('x^2', 3)).toBe(9);
  });
  it('evalúa 2*x+1 en x=0 → 1', () => {
    expect(evaluatePoint('2*x+1', 0)).toBe(1);
  });
  it('evalúa sin(x) en x=0 → 0', () => {
    expect(evaluatePoint('sin(x)', 0)).toBeCloseTo(0);
  });
  it('evalúa constante 5 en cualquier x → 5', () => {
    expect(evaluatePoint('5', 99)).toBe(5);
  });

  // Casos límite numéricos
  it('retorna null para 1/0 (división por cero)', () => {
    expect(evaluatePoint('1/x', 0)).toBeNull();
  });
  it('retorna null para sqrt(-1) (no real)', () => {
    expect(evaluatePoint('sqrt(-1)', 0)).toBeNull();
  });
  it('retorna null para log(-1)', () => {
    expect(evaluatePoint('log(-1)', 0)).toBeNull();
  });

  // Expresión inválida
  it('retorna null para expresión inválida "x **$ 2"', () => {
    expect(evaluatePoint('x **$ 2', 1)).toBeNull();
  });
  it('retorna null para string vacío', () => {
    expect(evaluatePoint('', 1)).toBeNull();
  });

  // Valores negativos de x
  it('evalúa x^2 en x=-4 → 16', () => {
    expect(evaluatePoint('x^2', -4)).toBe(16);
  });
  it('evalúa x^3 en x=-2 → -8', () => {
    expect(evaluatePoint('x^3', -2)).toBe(-8);
  });
});

describe('adaptiveSample', () => {
  it('retorna array de Points con x e y numéricos', () => {
    const pts = adaptiveSample('x^2', -2, 2);
    expect(pts.length).toBeGreaterThan(0);
    pts.forEach((p: Point) => {
      expect(typeof p.x).toBe('number');
      expect(typeof p.y).toBe('number');
    });
  });

  it('el primer punto tiene x cercano a a y el último cercano a b', () => {
    const pts = adaptiveSample('x^2', -5, 5);
    expect(pts[0].x).toBeCloseTo(-5, 5);
    expect(pts[pts.length - 1].x).toBeCloseTo(5, 5);
  });

  it('genera más puntos donde la función cambia rápido (sin(10x) vs x)', () => {
    const ptsFast = adaptiveSample('sin(10*x)', 0, 1);
    const ptsSlow = adaptiveSample('x', 0, 1);
    expect(ptsFast.length).toBeGreaterThan(ptsSlow.length);
  });

  it('para función lineal retorna pocos puntos (converge rápido)', () => {
    const pts = adaptiveSample('2*x+1', -10, 10);
    expect(pts.length).toBeLessThan(50);
  });

  it('omite puntos donde evaluatePoint retorna null (1/x cerca de 0)', () => {
    const pts = adaptiveSample('1/x', -5, 5);
    pts.forEach((p: Point) => {
      expect(isFinite(p.y)).toBe(true);
      expect(isNaN(p.y)).toBe(false);
    });
  });

  it('respeta maxDepth — más profundidad genera más puntos', () => {
    const ptsShallow = adaptiveSample('sin(x)', 0, Math.PI, 4);
    const ptsDeep    = adaptiveSample('sin(x)', 0, Math.PI, 10);
    expect(ptsDeep.length).toBeGreaterThanOrEqual(ptsShallow.length);
  });
});

describe('sampleParametric', () => {
  it('exporta la función sampleParametric', () => {
    expect(typeof sampleParametric).toBe('function');
  });

  it('círculo unitario: x=cos(t), y=sin(t) retorna puntos finitos', () => {
    const pts = sampleParametric('cos(t)', 'sin(t)', 0, 2 * Math.PI);
    expect(pts.length).toBeGreaterThan(10);
    pts.forEach(p => {
      expect(isFinite(p.x)).toBe(true);
      expect(isFinite(p.y)).toBe(true);
    });
  });

  it('puntos del círculo unitario satisfacen x²+y²≈1', () => {
    const pts = sampleParametric('cos(t)', 'sin(t)', 0, 2 * Math.PI);
    pts.forEach(p => {
      expect(p.x * p.x + p.y * p.y).toBeCloseTo(1, 3);
    });
  });

  it('retorna arreglo vacío si expresiones vacías', () => {
    const pts = sampleParametric('', '', 0, 1);
    expect(pts.length).toBe(0);
  });

  it('recta paramétrica x=t, y=2t: y ≈ 2x en todos los puntos', () => {
    const pts = sampleParametric('t', '2*t', -5, 5);
    pts.forEach(p => {
      expect(p.y).toBeCloseTo(2 * p.x, 5);
    });
  });
});

describe('samplePolar', () => {
  it('exporta la función samplePolar', () => {
    expect(typeof samplePolar).toBe('function');
  });

  it('círculo polar r=1: todos los puntos a distancia ≈1 del origen', () => {
    const pts = samplePolar('1', 0, 2 * Math.PI);
    expect(pts.length).toBeGreaterThan(10);
    pts.forEach(p => {
      const dist = Math.sqrt(p.x * p.x + p.y * p.y);
      expect(dist).toBeCloseTo(1, 3);
    });
  });

  it('r=0 retorna puntos en el origen', () => {
    const pts = samplePolar('0', 0, Math.PI);
    pts.forEach(p => {
      expect(p.x).toBeCloseTo(0, 5);
      expect(p.y).toBeCloseTo(0, 5);
    });
  });

  it('retorna arreglo vacío si expresión vacía', () => {
    const pts = samplePolar('', 0, 2 * Math.PI);
    expect(pts.length).toBe(0);
  });

  it('espiral r=theta: distancia al origen crece con theta', () => {
    const pts = samplePolar('theta', 0, 4 * Math.PI, 50);
    const dists = pts.map(p => Math.sqrt(p.x * p.x + p.y * p.y));
    for (let i = 1; i < dists.length; i++) {
      expect(dists[i]).toBeGreaterThanOrEqual(dists[i - 1] - 0.01);
    }
  });
});

// ── NUEVO BLOQUE ────────────────────────────────────────────────────────────
import { numericalIntegral } from '@engine/graphEngine/evaluator';

describe('numericalIntegral', () => {
  it('integra x^2 en [0,1] ≈ 0.333', () => {
    const result = numericalIntegral('x^2', 0, 1);
    expect(result).toBeCloseTo(0.333, 2);
  });

  it('integra sin(x) en [0, pi] ≈ 2', () => {
    const result = numericalIntegral('sin(x)', 0, Math.PI);
    expect(result).toBeCloseTo(2, 2);
  });

  it('integra 1 en [0, 5] = 5 exacto', () => {
    const result = numericalIntegral('1', 0, 5);
    expect(result).toBeCloseTo(5, 4);
  });

  it('retorna 0 si a === b', () => {
    const result = numericalIntegral('x^2', 3, 3);
    expect(result).toBe(0);
  });

  it('retorna valor negativo si a > b', () => {
    const result = numericalIntegral('x^2', 1, 0);
    expect(result).toBeLessThan(0);
  });

  it('retorna 0 si expr está vacía', () => {
    const result = numericalIntegral('', 0, 1);
    expect(result).toBe(0);
  });

  it('integra constante 3 en [2, 5] = 9', () => {
    const result = numericalIntegral('3', 2, 5);
    expect(result).toBeCloseTo(9, 3);
  });
});