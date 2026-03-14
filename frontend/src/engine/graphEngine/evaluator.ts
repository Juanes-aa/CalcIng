import * as math from 'mathjs';

/**
 * Evalúa una expresión matemática en un punto.
 * Retorna el valor numérico, o null si:
 * - la expresión es inválida o vacía
 * - el resultado no es un número finito real
 */
export function evaluatePoint(expr: string, val: number, variable = 'x'): number | null {
  if (expr.trim() === '') return null;

  try {
    const compiled = math.compile(expr);
    const result = compiled.evaluate({ [variable]: val });

    if (typeof result !== 'number') return null;
    if (!isFinite(result) || isNaN(result)) return null;

    return result;
  } catch {
    return null;
  }
}

/** Par de coordenadas para graficación */
export interface Point {
  x: number;
  y: number;
}

/**
 * Muestreo adaptativo según algoritmo del roadmap sección 6.3.
 * Concentra puntos donde f' es grande (función cambia rápido).
 * Omite sub-intervalos donde evaluatePoint retorna null.
 */
export function adaptiveSample(
  expr: string,
  a: number,
  b: number,
  maxDepth: number = 8,
  tol: number = 0.005
): Point[] {
  function refine(
    x1: number, x2: number,
    y1: number, y2: number,
    depth: number
  ): Point[] {
    const xm = (x1 + x2) / 2;
    const ym = evaluatePoint(expr, xm);

    if (ym === null) return [];

    const yInterp = (y1 + y2) / 2;
    const error = Math.abs(ym - yInterp);

    if (depth >= maxDepth || error < tol) {
      return [{ x: xm, y: ym }];
    }

    return [
      ...refine(x1, xm, y1, ym, depth + 1),
      { x: xm, y: ym },
      ...refine(xm, x2, ym, y2, depth + 1),
    ];
  }

  const ya = evaluatePoint(expr, a);
  const yb = evaluatePoint(expr, b);

  if (ya === null || yb === null) {
    const mid = (a + b) / 2;
    const ymid = evaluatePoint(expr, mid);
    if (ymid === null) return [];
    return [
      ...adaptiveSample(expr, a, mid, maxDepth, tol),
      { x: mid, y: ymid },
      ...adaptiveSample(expr, mid, b, maxDepth, tol),
    ];
  }

  const start: Point[] = [{ x: a, y: ya }];
  const middle = refine(a, b, ya, yb, 0);
  const end: Point[] = [{ x: b, y: yb }];

  return [...start, ...middle, ...end];
}

export function sampleParametric(
  exprX: string,
  exprY: string,
  tMin: number,
  tMax: number,
  n = 200
): Point[] {
  if (!exprX.trim() || !exprY.trim()) return [];
  const points: Point[] = [];
  const step = (tMax - tMin) / (n - 1);
  for (let i = 0; i < n; i++) {
    const t = tMin + i * step;
    const x = evaluatePoint(exprX, t, 't');
    const y = evaluatePoint(exprY, t, 't');
    if (x !== null && y !== null) {
      points.push({ x, y });
    }
  }
  return points;
}

export function samplePolar(
  exprR: string,
  thetaMin: number,
  thetaMax: number,
  n = 200
): Point[] {
  if (!exprR.trim()) return [];
  const points: Point[] = [];
  const step = (thetaMax - thetaMin) / (n - 1);
  for (let i = 0; i < n; i++) {
    const theta = thetaMin + i * step;
    const r = evaluatePoint(exprR, theta, 'theta');
    if (r !== null) {
      points.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
    }
  }
  return points;
}

export function numericalIntegral(expr: string, a: number, b: number, n = 500): number {
  if (!expr.trim()) return 0;
  if (a === b) return 0;
  const step = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x0 = a + i * step;
    const x1 = a + (i + 1) * step;
    const y0 = evaluatePoint(expr, x0) ?? 0;
    const y1 = evaluatePoint(expr, x1) ?? 0;
    sum += (y0 + y1) * 0.5 * step;
  }
  return sum;
}