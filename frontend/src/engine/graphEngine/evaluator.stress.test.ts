import { describe, expect, it } from 'vitest';
import {
  adaptiveSample,
  evaluatePoint,
  numericalIntegral,
  sampleParametric,
  samplePolar,
} from './evaluator';

function distance(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

describe('graph evaluator stress', () => {
  it('evalua un polinomio de grado alto con precision estable', () => {
    expect(evaluatePoint('x^7 - 3*x^3 + 2', 1.5)).toBeCloseTo(1.5 ** 7 - 3 * 1.5 ** 3 + 2, 10);
  });

  it('evalua exp(-x^2) con buen control numerico', () => {
    expect(evaluatePoint('exp(-x^2)', 2)).toBeCloseTo(Math.exp(-4), 10);
  });

  it('evalua una oscilacion rapida en un maximo conocido', () => {
    expect(evaluatePoint('sin(40*x)', Math.PI / 80)).toBeCloseTo(1, 10);
  });

  it('respeta la variable alternativa t en evaluatePoint', () => {
    expect(evaluatePoint('t^3 - t', 2, 't')).toBeCloseTo(6, 10);
  });

  it('preserva los extremos del intervalo en adaptiveSample', () => {
    const points = adaptiveSample('x^3', -2, 2);
    expect(points[0]?.x).toBeCloseTo(-2, 8);
    expect(points.at(-1)?.x).toBeCloseTo(2, 8);
  });

  it('muestra mas densidad para una funcion muy oscilatoria', () => {
    const fast = adaptiveSample('sin(50*x)', 0, 1, 12, 0.00001);
    const slow = adaptiveSample('x', 0, 1, 12, 0.00001);
    expect(fast.length).toBeGreaterThan(slow.length);
  });

  it('mantiene los puntos de la parabola sobre y = x^2', () => {
    const points = adaptiveSample('x^2', -3, 3);
    for (const point of points) {
      expect(point.y).toBeCloseTo(point.x * point.x, 8);
    }
  });

  it('captura la cuspide de abs(x) cerca del origen', () => {
    const points = adaptiveSample('abs(x)', -2, 2);
    const nearest = points.reduce((best, point) =>
      Math.abs(point.x) < Math.abs(best.x) ? point : best
    );
    expect(Math.abs(nearest.x)).toBeLessThanOrEqual(0.1);
    expect(nearest.y).toBeCloseTo(Math.abs(nearest.x), 8);
  });

  it('mantiene solo valores finitos alrededor de una discontinuidad', () => {
    const points = adaptiveSample('1/x', -1, 1);
    for (const point of points) {
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
    }
  });

  it('traza un circulo parametrico con radio unitario', () => {
    const points = sampleParametric('cos(t)', 'sin(t)', 0, 2 * Math.PI, 240);
    expect(points.length).toBeGreaterThan(100);
    for (const point of points) {
      expect(distance(point.x, point.y)).toBeCloseTo(1, 3);
    }
  });

  it('traza una elipse parametrica con semiejes 2 y 3', () => {
    const points = sampleParametric('2*cos(t)', '3*sin(t)', 0, 2 * Math.PI, 240);
    for (const point of points) {
      expect((point.x * point.x) / 4 + (point.y * point.y) / 9).toBeCloseTo(1, 3);
    }
  });

  it('traza una parabola parametrica consistente con y = x^2', () => {
    const points = sampleParametric('t', 't^2', -3, 3, 240);
    for (const point of points) {
      expect(point.y).toBeCloseTo(point.x * point.x, 6);
    }
  });

  it('traza una recta parametrica con proporcion constante entre x e y', () => {
    const points = sampleParametric('2*t', '-3*t', -5, 5, 240);
    for (const point of points) {
      if (Math.abs(point.x) < 1e-9) continue;
      expect(point.y / point.x).toBeCloseTo(-1.5, 6);
    }
  });

  it('traza un circulo polar de radio 2', () => {
    const points = samplePolar('2', 0, 2 * Math.PI, 240);
    for (const point of points) {
      expect(distance(point.x, point.y)).toBeCloseTo(2, 3);
    }
  });

  it('traza un cardioide polar que llega cerca del origen', () => {
    const points = samplePolar('1 + cos(theta)', 0, 2 * Math.PI, 240);
    const minDistance = Math.min(...points.map((point) => distance(point.x, point.y)));
    expect(minDistance).toBeLessThan(0.05);
  });

  it('traza una rosa polar contenida dentro del disco unitario', () => {
    const points = samplePolar('cos(2*theta)', 0, 2 * Math.PI, 240);
    for (const point of points) {
      expect(distance(point.x, point.y)).toBeLessThanOrEqual(1.001);
    }
  });

  it('integra x^2 en [0, 1] con buena precision', () => {
    expect(numericalIntegral('x^2', 0, 1, 4000)).toBeCloseTo(1 / 3, 4);
  });

  it('integra sin(x) en [0, pi] con buena precision', () => {
    expect(numericalIntegral('sin(x)', 0, Math.PI, 4000)).toBeCloseTo(2, 4);
  });

  it('integra una funcion impar en intervalo simetrico y obtiene casi cero', () => {
    expect(numericalIntegral('x^3 - x', -2, 2, 4000)).toBeCloseTo(0, 4);
  });

  it('integra exp(x) en [0, 1] y aproxima e - 1', () => {
    expect(numericalIntegral('exp(x)', 0, 1, 4000)).toBeCloseTo(Math.E - 1, 4);
  });
});
