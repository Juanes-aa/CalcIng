import { describe, expect, it } from 'vitest';
import {
  adaptiveSample,
  evaluatePoint,
  numericalIntegral,
  sampleParametric,
  samplePolar,
} from './evaluator';

function dist(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

describe('graph evaluator extreme', () => {
  it('evalua magnitudes grandes sin perder finitud', () => {
    expect(evaluatePoint('1000000*x', 2)).toBeCloseTo(2000000, 6);
  });

  it('retorna null para una raiz no real dependiente de x', () => {
    expect(evaluatePoint('sqrt(-x)', 1)).toBeNull();
  });

  it('evalua correctamente con variable theta explicita', () => {
    expect(evaluatePoint('theta^2 + 1', 3, 'theta')).toBeCloseTo(10, 10);
  });

  it('adaptiveSample mantiene x en orden creciente', () => {
    const points = adaptiveSample('sin(10*x)', -2, 2, 10, 0.0001);
    for (let i = 1; i < points.length; i++) {
      expect(points[i]!.x).toBeGreaterThanOrEqual(points[i - 1]!.x);
    }
  });

  it('adaptiveSample refina abs(sin(20*x)) mas que una recta', () => {
    const fast = adaptiveSample('abs(sin(20*x))', 0, 1, 12, 0.000001);
    const slow = adaptiveSample('x', 0, 1, 12, 0.000001);
    expect(fast.length).toBeGreaterThan(slow.length);
  });

  it('adaptiveSample de tan(x) en rango seguro produce valores finitos', () => {
    const points = adaptiveSample('tan(x)', -1.2, 1.2, 10, 0.0001);
    expect(points.length).toBeGreaterThan(10);
    for (const point of points) {
      expect(Number.isFinite(point.y)).toBe(true);
    }
  });

  it('adaptiveSample de una cubica conserva el valor exacto en cada punto', () => {
    const points = adaptiveSample('x^3 - x', -2, 2, 10, 0.00001);
    for (const point of points) {
      expect(point.y).toBeCloseTo(point.x ** 3 - point.x, 7);
    }
  });

  it('sampleParametric de Lissajous queda dentro del cuadro unitario', () => {
    const points = sampleParametric('sin(3*t)', 'sin(4*t)', 0, 2 * Math.PI, 300);
    for (const point of points) {
      expect(Math.abs(point.x)).toBeLessThanOrEqual(1.001);
      expect(Math.abs(point.y)).toBeLessThanOrEqual(1.001);
    }
  });

  it('sampleParametric de espiral aumenta distancia promedio al origen', () => {
    const points = sampleParametric('t*cos(t)', 't*sin(t)', 0, 4 * Math.PI, 300);
    const firstHalf = points.slice(0, 100).reduce((acc, p) => acc + dist(p.x, p.y), 0) / 100;
    const lastHalf = points.slice(-100).reduce((acc, p) => acc + dist(p.x, p.y), 0) / 100;
    expect(lastHalf).toBeGreaterThan(firstHalf);
  });

  it('sampleParametric conserva los extremos esperados de una recta', () => {
    const points = sampleParametric('t', '2*t', -3, 3, 50);
    expect(points[0]?.x).toBeCloseTo(-3, 8);
    expect(points[0]?.y).toBeCloseTo(-6, 8);
    expect(points.at(-1)?.x).toBeCloseTo(3, 8);
    expect(points.at(-1)?.y).toBeCloseTo(6, 8);
  });

  it('samplePolar de una espiral r = theta/2 crece en promedio', () => {
    const points = samplePolar('theta/2', 0, 4 * Math.PI, 300);
    const firstHalf = points.slice(0, 100).reduce((acc, p) => acc + dist(p.x, p.y), 0) / 100;
    const lastHalf = points.slice(-100).reduce((acc, p) => acc + dist(p.x, p.y), 0) / 100;
    expect(lastHalf).toBeGreaterThan(firstHalf);
  });

  it('samplePolar de 2*cos(theta) queda dentro del circulo esperado', () => {
    const points = samplePolar('2*cos(theta)', 0, 2 * Math.PI, 300);
    for (const point of points) {
      expect(point.x * point.x + point.y * point.y).toBeLessThanOrEqual(4.01);
    }
  });

  it('samplePolar de radio constante 0.5 mantiene distancia fija', () => {
    const points = samplePolar('0.5', 0, 2 * Math.PI, 120);
    for (const point of points) {
      expect(dist(point.x, point.y)).toBeCloseTo(0.5, 4);
    }
  });

  it('integra cos(x) en [0, pi/2] con buena precision', () => {
    expect(numericalIntegral('cos(x)', 0, Math.PI / 2, 4000)).toBeCloseTo(1, 4);
  });

  it('integra x^3 en [-1, 1] y obtiene casi cero', () => {
    expect(numericalIntegral('x^3', -1, 1, 4000)).toBeCloseTo(0, 5);
  });

  it('integra constante 1 con orientacion invertida', () => {
    expect(numericalIntegral('1', 5, -5, 4000)).toBeCloseTo(-10, 4);
  });

  it('refinar n mejora la precision en x^2', () => {
    const coarseError = Math.abs(numericalIntegral('x^2', 0, 1, 20) - 1 / 3);
    const fineError = Math.abs(numericalIntegral('x^2', 0, 1, 2000) - 1 / 3);
    expect(fineError).toBeLessThan(coarseError);
  });

  it('integra abs(x) en [-1, 1] y obtiene aproximadamente 1', () => {
    expect(numericalIntegral('abs(x)', -1, 1, 4000)).toBeCloseTo(1, 4);
  });

  it('integra exp(-x^2) en [-2, 2] con buena precision', () => {
    expect(numericalIntegral('exp(-x^2)', -2, 2, 6000)).toBeCloseTo(1.76416, 3);
  });

  it('retorna null para expresion invalida con variable alternativa', () => {
    expect(evaluatePoint('theta + )', 1, 'theta')).toBeNull();
  });
});
