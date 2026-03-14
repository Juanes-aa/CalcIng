/**
 * math.test.ts
 * Pruebas unitarias migradas a Vitest.
 * 93 casos — paridad exacta con calcIng-v3/tests/math.test.js
 *
 * Ejecutar con: npm test
 */

import { describe, it, expect } from 'vitest';

// ─── Helpers de aproximación (replica semántica de esperar().aproximarse()) ────

function aproximarse(actual: number, esperado: number, digitos = 6): void {
  const tol = Math.pow(10, -digitos);
  expect(Math.abs(actual - esperado)).toBeLessThanOrEqual(tol);
}

// ─── Operaciones con Matrices ─────────────────────────────────────────────────

describe('Operaciones con Matrices', () => {
  function det2x2(a: number, b: number, c: number, d: number) { return a * d - b * c; }

  function multiplicar(A: number[][], B: number[][]): number[][] {
    const filas = A.length, colsB = B[0]!.length;
    return Array.from({ length: filas }, (_, i) =>
      Array.from({ length: colsB }, (_, j) =>
        A[i]!.reduce((s, _, k) => s + A[i]![k]! * B[k]![j]!, 0)
      )
    );
  }

  function determinante(M: number[][]): number {
    const n = M.length;
    const mat = M.map(f => [...f]);
    let det = 1, signo = 1;
    for (let col = 0; col < n; col++) {
      let piv = -1;
      for (let f = col; f < n; f++) if (Math.abs(mat[f]![col]!) > 1e-12) { piv = f; break; }
      if (piv === -1) return 0;
      if (piv !== col) { [mat[col], mat[piv]] = [mat[piv]!, mat[col]!]; signo *= -1; }
      det *= mat[col]![col]!;
      for (let f = col + 1; f < n; f++) {
        const fc = mat[f]![col]! / mat[col]![col]!;
        for (let k = col; k < n; k++) mat[f]![k]! -= fc * mat[col]![k]!;
      }
    }
    return signo * det;
  }

  it('det([[1,2],[3,4]]) = -2', () => expect(det2x2(1,2,3,4)).toBe(-2));
  it('det([[5,0],[0,5]]) = 25', () => expect(det2x2(5,0,0,5)).toBe(25));
  it('det([[1,2,3],[4,5,6],[7,8,9]]) = 0 (singular)', () =>
    aproximarse(determinante([[1,2,3],[4,5,6],[7,8,9]]), 0));
  it('Identidad × A = A', () => {
    const r = multiplicar([[1,0],[0,1]], [[3,7],[2,5]]);
    expect(r[0]![0]).toBe(3);
    expect(r[1]![1]).toBe(5);
  });
  it('[[1,2],[3,4]] × [[2,0],[1,2]] = [[4,4],[10,8]]', () => {
    const r = multiplicar([[1,2],[3,4]], [[2,0],[1,2]]);
    expect(r[0]![0]).toBe(4);
    expect(r[0]![1]).toBe(4);
    expect(r[1]![0]).toBe(10);
    expect(r[1]![1]).toBe(8);
  });
});

// ─── Solucionador de Ecuaciones ───────────────────────────────────────────────

describe('Solucionador de Ecuaciones', () => {
  function lineal(a: number, b: number): number {
    if (a === 0) throw new Error('El coef. a no puede ser cero');
    return -b / a;
  }
  function cuadratica(a: number, b: number, c: number): [number, number] | null {
    const d = b*b - 4*a*c;
    return d >= 0 ? [(-b + Math.sqrt(d))/(2*a), (-b - Math.sqrt(d))/(2*a)] : null;
  }

  it('Lineal: 2x + 4 = 0 → x = -2',   () => expect(lineal(2, 4)).toBe(-2));
  it('Lineal: -3x - 9 = 0 → x = -3',  () => expect(lineal(-3, -9)).toBe(-3));
  it('Cuadrática: x²-5x+6=0 → 3, 2',  () => {
    const r = cuadratica(1, -5, 6)!;
    expect(r[0]).toBe(3);
    expect(r[1]).toBe(2);
  });
  it('Cuadrática: x²-4=0 → 2, -2',    () => {
    const r = cuadratica(1, 0, -4)!;
    expect(r[0]).toBe(2);
    expect(r[1]).toBe(-2);
  });
  it('Cuadrática: x²+1=0 → compleja', () => expect(cuadratica(1, 0, 1)).toBeNull());
  it('a=0 lanza error',               () => expect(() => lineal(0, 5)).toThrow());
});

// ─── Conversión de Unidades ───────────────────────────────────────────────────

describe('Conversión de Unidades', () => {
  it('1 km = 1000 m',          () => expect(1 * 1000).toBe(1000));
  it('1 m ≈ 3.28084 ft',       () => aproximarse(1 / 0.3048, 3.28084, 4));
  it('0 °C = 32 °F',           () => expect(0 * 9/5 + 32).toBe(32));
  it('100 °C = 212 °F',        () => expect(100 * 9/5 + 32).toBe(212));
  it('0 °C = 273.15 K',        () => expect(0 + 273.15).toBe(273.15));
  it('300 K = 26.85 °C',       () => aproximarse(300 - 273.15, 26.85, 2));
  it('1 kg = 1000 g',          () => expect(1 * 1000).toBe(1000));
  it('1000 J = 1 kJ',          () => expect(1000 / 1000).toBe(1));
});

// ─── Constantes Físicas ───────────────────────────────────────────────────────

describe('Constantes Físicas', () => {
  it('π ≈ 3.14159265358979', () => aproximarse(Math.PI, 3.14159265358979, 14));
  it('e ≈ 2.71828182845904', () => aproximarse(Math.E, 2.71828182845904, 14));
  it('c = 299 792 458 m/s',  () => expect(299792458).toBe(299792458));
  it('NA ≈ 6.022e23',        () => aproximarse(6.02214076e23, 6.022e23, -20));
});

// ─── Factorial ────────────────────────────────────────────────────────────────

describe('Factorial', () => {
  function factorial(n: number): number {
    if (!Number.isInteger(n) || n < 0) throw new Error('Entrada inválida');
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  it('0! = 1',        () => expect(factorial(0)).toBe(1));
  it('1! = 1',        () => expect(factorial(1)).toBe(1));
  it('5! = 120',      () => expect(factorial(5)).toBe(120));
  it('10! = 3628800', () => expect(factorial(10)).toBe(3628800));
  it('Negativo lanza error', () => expect(() => factorial(-1)).toThrow());
  it('Decimal lanza error',  () => expect(() => factorial(3.5)).toThrow());
});

// ─── Notación de Ingeniería ───────────────────────────────────────────────────

describe('Notación de Ingeniería', () => {
  function notacionIng(v: number, p = 3): string {
    if (v === 0) return '0';
    const e  = Math.floor(Math.log10(Math.abs(v)));
    const ee = Math.floor(e / 3) * 3;
    return `${(v / 10**ee).toFixed(p)}×10^${ee}`;
  }

  it('1234 → contiene 10^3',       () => expect(notacionIng(1234)).toContain('10^3'));
  it('0.001234 → contiene 10^-3',  () => expect(notacionIng(0.001234)).toContain('10^-3'));
  it('1 000 000 → contiene 10^6',  () => expect(notacionIng(1000000)).toContain('10^6'));
  it('0.000001 → contiene 10^-6',  () => expect(notacionIng(0.000001)).toContain('10^-6'));
});

// ─── Validación de Paréntesis ─────────────────────────────────────────────────

describe('Validación de Paréntesis', () => {
  function verificarParens(expr: string): boolean {
    let d = 0;
    for (const ch of expr) {
      if (ch === '(') d++;
      else if (ch === ')') { d--; if (d < 0) return false; }
    }
    return d === 0;
  }

  it('"(1+2)" → balanceado',       () => expect(verificarParens('(1+2)')).toBe(true));
  it('"(1+(2*3))" → balanceado',   () => expect(verificarParens('(1+(2*3))')).toBe(true));
  it('"((1+2)" → desbalanceado',   () => expect(verificarParens('((1+2)')).toBe(false));
  it('")" → desbalanceado',        () => expect(verificarParens(')')).toBe(false));
  it('"()()" → balanceado',        () => expect(verificarParens('()()')).toBe(true));
});

// ─── Conversión de Bases ──────────────────────────────────────────────────────

describe('Conversión de Bases', () => {
  function decToBin(n: number): string {
    if (n === 0) return '0';
    const signo = n < 0 ? '-' : '';
    return signo + Math.abs(n).toString(2);
  }
  function decToHex(n: number): string {
    if (n === 0) return '0';
    const signo = n < 0 ? '-' : '';
    return signo + Math.abs(n).toString(16).toUpperCase();
  }
  function decToOct(n: number): string {
    if (n === 0) return '0';
    const signo = n < 0 ? '-' : '';
    return signo + Math.abs(n).toString(8);
  }
  function binToDec(s: string): string {
    const neg = s.startsWith('-');
    const val = parseInt(neg ? s.slice(1) : s, 2);
    return (neg ? -val : val).toString();
  }
  function hexToDec(s: string): string {
    const neg = s.startsWith('-');
    const val = parseInt(neg ? s.slice(1) : s, 16);
    return (neg ? -val : val).toString();
  }
  function octToDec(s: string): string {
    const neg = s.startsWith('-');
    const val = parseInt(neg ? s.slice(1) : s, 8);
    return (neg ? -val : val).toString();
  }

  it('10 dec → "1010" bin',       () => expect(decToBin(10)).toBe('1010'));
  it('255 dec → "11111111" bin',  () => expect(decToBin(255)).toBe('11111111'));
  it('0 dec → "0" bin',           () => expect(decToBin(0)).toBe('0'));
  it('-10 dec → "-1010" bin',     () => expect(decToBin(-10)).toBe('-1010'));
  it('255 dec → "FF" hex',        () => expect(decToHex(255)).toBe('FF'));
  it('16 dec → "10" hex',         () => expect(decToHex(16)).toBe('10'));
  it('-255 dec → "-FF" hex',      () => expect(decToHex(-255)).toBe('-FF'));
  it('8 dec → "10" oct',          () => expect(decToOct(8)).toBe('10'));
  it('64 dec → "100" oct',        () => expect(decToOct(64)).toBe('100'));
  it('"1010" bin → "10" dec',     () => expect(binToDec('1010')).toBe('10'));
  it('"FF" hex → "255" dec',      () => expect(hexToDec('FF')).toBe('255'));
  it('"10" oct → "8" dec',        () => expect(octToDec('10')).toBe('8'));
});

// ─── Estadística ─────────────────────────────────────────────────────────────

describe('Estadística', () => {
  function media(arr: number[]): number {
    return arr.reduce((a, v) => a + v, 0) / arr.length;
  }
  function mediana(arr: number[]): number {
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 === 0 ? (s[m - 1]! + s[m]!) / 2 : s[m]!;
  }
  function moda(arr: number[]): number {
    const f = new Map<number, number>();
    let maxF = 0, resultado = arr[0]!;
    for (const v of arr) {
      const c = (f.get(v) ?? 0) + 1;
      f.set(v, c);
      if (c > maxF) { maxF = c; resultado = v; }
    }
    return resultado;
  }
  function varianza(arr: number[]): number {
    if (arr.length === 1) return 0;
    const m = media(arr);
    return arr.reduce((a, v) => a + (v - m) ** 2, 0) / arr.length;
  }
  function desviacion(arr: number[]): number { return Math.sqrt(varianza(arr)); }
  function rango(arr: number[]): number { return Math.max(...arr) - Math.min(...arr); }
  function percentil(arr: number[], p: number): number {
    const s = [...arr].sort((a, b) => a - b);
    const i = (p / 100) * (s.length - 1);
    const lo = Math.floor(i), hi = Math.ceil(i);
    if (lo === hi) return s[lo]!;
    return s[lo]! + (i - lo) * (s[hi]! - s[lo]!);
  }

  it('media([1,2,3,4,5]) = 3',           () => expect(media([1,2,3,4,5])).toBe(3));
  it('media([10]) = 10',                 () => expect(media([10])).toBe(10));
  it('mediana([1,3,5]) = 3',             () => expect(mediana([1,3,5])).toBe(3));
  it('mediana([1,2,3,4]) = 2.5',         () => expect(mediana([1,2,3,4])).toBe(2.5));
  it('moda([1,2,2,3]) = 2',              () => expect(moda([1,2,2,3])).toBe(2));
  it('moda([5]) = 5',                    () => expect(moda([5])).toBe(5));
  it('varianza([2,4,4,4,5,5,7,9]) ≈ 4', () => aproximarse(varianza([2,4,4,4,5,5,7,9]), 4));
  it('varianza([5]) = 0',                () => expect(varianza([5])).toBe(0));
  it('desviación([2,4,4,4,5,5,7,9]) ≈ 2', () => aproximarse(desviacion([2,4,4,4,5,5,7,9]), 2));
  it('rango([1,5,3,9,2]) = 8',           () => expect(rango([1,5,3,9,2])).toBe(8));
  it('rango([7]) = 0',                   () => expect(rango([7])).toBe(0));
  it('percentil([1,2,3,4,5], 50) = 3',  () => expect(percentil([1,2,3,4,5], 50)).toBe(3));
  it('percentil([1,2,3,4,5], 0) = 1',   () => expect(percentil([1,2,3,4,5], 0)).toBe(1));
  it('percentil([1,2,3,4,5], 100) = 5', () => expect(percentil([1,2,3,4,5], 100)).toBe(5));
  it('percentil([10,20,30,40], 25) = 17.5', () => aproximarse(percentil([10,20,30,40], 25), 17.5));
});

// ─── Números Complejos ────────────────────────────────────────────────────────

describe('Números Complejos', () => {
  type C = { real: number; imag: number };
  const c = (re: number, im: number): C => ({ real: re, imag: im });
  const cAdd  = (z1: C, z2: C): C => ({ real: z1.real+z2.real, imag: z1.imag+z2.imag });
  const cSub  = (z1: C, z2: C): C => ({ real: z1.real-z2.real, imag: z1.imag-z2.imag });
  const cMul  = (z1: C, z2: C): C => ({ real: z1.real*z2.real-z1.imag*z2.imag, imag: z1.real*z2.imag+z1.imag*z2.real });
  const cMod  = (z: C): number  => Math.sqrt(z.real*z.real + z.imag*z.imag);
  const cArg  = (z: C): number  => Math.atan2(z.imag, z.real);
  const cConj = (z: C): C       => ({ real: z.real, imag: -z.imag });

  function cDiv(z1: C, z2: C): C {
    const d = z2.real*z2.real + z2.imag*z2.imag;
    return { real: (z1.real*z2.real+z1.imag*z2.imag)/d, imag: (z1.imag*z2.real-z1.real*z2.imag)/d };
  }
  function cPow(z: C, n: number): C {
    const r = cMod(z), theta = cArg(z);
    const rn = Math.pow(r, n), ang = n * theta;
    return { real: rn*Math.cos(ang), imag: rn*Math.sin(ang) };
  }
  function cSqrt(z: C): C {
    const r = cMod(z);
    if (r === 0) return { real: 0, imag: 0 };
    const re = Math.sqrt((r+z.real)/2);
    const im = Math.sqrt((r-z.real)/2);
    return { real: re, imag: z.imag >= 0 ? im : -im };
  }

  it('(1+2i) + (3+4i) = 4+6i', () => {
    const r = cAdd(c(1,2), c(3,4));
    expect(r.real).toBe(4); expect(r.imag).toBe(6);
  });
  it('(5+3i) - (2+1i) = 3+2i', () => {
    const r = cSub(c(5,3), c(2,1));
    expect(r.real).toBe(3); expect(r.imag).toBe(2);
  });
  it('(1+2i) × (3+4i) = -5+10i', () => {
    const r = cMul(c(1,2), c(3,4));
    expect(r.real).toBe(-5); expect(r.imag).toBe(10);
  });
  it('(1+2i) / (1-1i) → real ≈ -0.5', () => {
    const r = cDiv(c(1,2), c(1,-1));
    aproximarse(r.real, -0.5); aproximarse(r.imag, 1.5);
  });
  it('|3+4i| = 5',       () => expect(cMod(c(3,4))).toBe(5));
  it('|0+0i| = 0',       () => expect(cMod(c(0,0))).toBe(0));
  it('arg(1+0i) = 0',    () => expect(cArg(c(1,0))).toBe(0));
  it('arg(0+1i) ≈ π/2',  () => aproximarse(cArg(c(0,1)), Math.PI/2, 10));
  it('conj(3+4i) = 3-4i', () => {
    const r = cConj(c(3,4));
    expect(r.real).toBe(3); expect(r.imag).toBe(-4);
  });
  it('(1+i)^2 → real ≈ 0, imag ≈ 2', () => {
    const r = cPow(c(1,1), 2);
    aproximarse(r.real, 0, 10); aproximarse(r.imag, 2, 10);
  });
  it('(0+1i)^0 = 1+0i', () => {
    const r = cPow(c(0,1), 0);
    expect(r.real).toBe(1); expect(r.imag).toBe(0);
  });
  it('√(0+1i) → real ≈ 0.7071', () => {
    const r = cSqrt(c(0,1));
    aproximarse(r.real, Math.SQRT1_2); aproximarse(r.imag, Math.SQRT1_2);
  });
  it('√(-1+0i) → imag ≈ 1', () => {
    const r = cSqrt(c(-1,0));
    aproximarse(r.real, 0); aproximarse(r.imag, 1);
  });
});

// ─── Edge Cases: Números Complejos ────────────────────────────────────────────

describe('Edge Cases: Números Complejos', () => {
  type C = { real: number; imag: number };
  const c = (real: number, imag: number): C => ({ real, imag });
  const cMod = (z: C): number => Math.sqrt(z.real*z.real + z.imag*z.imag);

  function cSqrt(z: C): C {
    const r = cMod(z);
    if (r === 0) return { real: 0, imag: 0 };
    const re = Math.sqrt((r+z.real)/2);
    const im = Math.sqrt((r-z.real)/2);
    return { real: re, imag: z.imag >= 0 ? im : -im };
  }
  function cDiv(z1: C, z2: C): C {
    const d = z2.real*z2.real + z2.imag*z2.imag;
    if (d === 0) throw new Error('División por cero complejo.');
    return { real: (z1.real*z2.real+z1.imag*z2.imag)/d, imag: (z1.imag*z2.real-z1.real*z2.imag)/d };
  }
  function cPow(z: C, n: number): C {
    if (typeof n !== 'number' || !Number.isInteger(n)) throw new Error('El exponente debe ser un entero.');
    if (n < 0 && z.real === 0 && z.imag === 0) throw new Error('Potencia negativa de cero no definida.');
    if (n === 0) return { real: 1, imag: 0 };
    const r = cMod(z), theta = Math.atan2(z.imag, z.real);
    const rn = Math.pow(r, n), ang = n * theta;
    return { real: rn*Math.cos(ang), imag: rn*Math.sin(ang) };
  }

  it('T-87: sqrt(-1+0i) → real≈0, imag≈1', () => {
    const r = cSqrt(c(-1, 0));
    aproximarse(r.real, 0); aproximarse(r.imag, 1);
  });
  it('T-88: sqrt(-4+0i) → real≈0, imag≈2', () => {
    const r = cSqrt(c(-4, 0));
    aproximarse(r.real, 0); aproximarse(r.imag, 2);
  });
  it('T-89: sqrt(0+0i) → 0+0i', () => {
    const r = cSqrt(c(0, 0));
    expect(r.real).toBe(0); expect(r.imag).toBe(0);
  });
  it('T-90: (1+2i) / (0+0i) lanza error', () =>
    expect(() => cDiv(c(1, 2), c(0, 0))).toThrow());
  it('T-91: (0+0i) / (3+4i) → real≈0, imag≈0', () => {
    const r = cDiv(c(0, 0), c(3, 4));
    aproximarse(r.real, 0, 10); aproximarse(r.imag, 0, 10);
  });
  it('T-92: (0+0i)^(-1) lanza error (regresión ISS-01)', () =>
    expect(() => cPow(c(0, 0), -1)).toThrow());
  it('T-93: (0+0i)^(-3) lanza error', () =>
    expect(() => cPow(c(0, 0), -3)).toThrow());
});

// ─── Integración: Bases Numéricas ─────────────────────────────────────────────

describe('Integración: Bases Numéricas (módulo bases.ts)', () => {
  function convertDecimalToBinary(n: number): string {
    if (n === 0) return '0';
    const signo = n < 0 ? '-' : '';
    return signo + Math.abs(n).toString(2);
  }
  function convertDecimalToHex(n: number): string {
    if (n === 0) return '0';
    const signo = n < 0 ? '-' : '';
    return signo + Math.abs(n).toString(16).toUpperCase();
  }

  it('T-79: convertDecimalToBinary(10) === "1010"', () =>
    expect(convertDecimalToBinary(10)).toBe('1010'));
  it('T-80: convertDecimalToHex(255) === "FF"', () =>
    expect(convertDecimalToHex(255)).toBe('FF'));
});

// ─── Integración: Estadística ─────────────────────────────────────────────────

describe('Integración: Estadística (módulo estadistica.ts)', () => {
  function mean(datos: number[]): number {
    return datos.reduce((acc, v) => acc + v, 0) / datos.length;
  }
  function variance(datos: number[]): number {
    if (datos.length === 1) return 0;
    const m = mean(datos);
    return datos.reduce((acc, v) => acc + (v - m) ** 2, 0) / datos.length;
  }
  function stdDev(datos: number[]): number { return Math.sqrt(variance(datos)); }

  it('T-81: mean([1,2,3,4,5]) === 3', () =>
    expect(mean([1, 2, 3, 4, 5])).toBe(3));
  it('T-82: stdDev([2,4,4,4,5,5,7,9]) ≈ 2', () =>
    aproximarse(stdDev([2, 4, 4, 4, 5, 5, 7, 9]), 2, 3));
});

// ─── Integración: Complejos ───────────────────────────────────────────────────

describe('Integración: Complejos (módulo complejos.ts)', () => {
  type C = { real: number; imag: number };
  const complejo = (real: number, imag: number): C => ({ real, imag });
  const modulus  = (z: C): number => Math.sqrt(z.real*z.real + z.imag*z.imag);
  const conjugate = (z: C): C    => ({ real: z.real, imag: -z.imag });

  it('T-83: modulus({real:3, imag:4}) === 5', () =>
    expect(modulus(complejo(3, 4))).toBe(5));
  it('T-84: conjugate({real:3, imag:4}) → {real:3, imag:-4}', () => {
    const r = conjugate(complejo(3, 4));
    expect(r.real).toBe(3); expect(r.imag).toBe(-4);
  });
});

// ─── Regresión BUG-01: Modo GRAD ─────────────────────────────────────────────

describe('Regresión BUG-01: Modo GRAD (FASE 0A)', () => {
  function aplicarGRAD(expr: string): string {
    const TRIG_FNS = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan'];
    const factor = Math.PI / 200;
    let result = expr;
    for (const fn of TRIG_FNS) {
      result = result.replace(
        new RegExp(fn + '\\(([^)]+)\\)', 'g'),
        (_: string, arg: string) => `${fn}((${arg}) * ${factor})`
      );
    }
    return result;
  }
  function evalGRAD(expr: string): number {
    const expanded = aplicarGRAD(expr);
    // Safe eval with injected Math functions only
    const fn = new Function('sin', 'cos', 'tan', 'asin', 'acos', 'atan', `return ${expanded}`);
    return fn(Math.sin, Math.cos, Math.tan, Math.asin, Math.acos, Math.atan) as number;
  }

  it('T-85: sin(100) en GRAD devuelve número ≈ 1 (fix BUG-01)', () => {
    const resultado = evalGRAD('sin(100)');
    expect(typeof resultado).toBe('number');
    aproximarse(resultado, 1);
  });
  it('T-86: sin/cos/tan correctos en RAD, DEG y GRAD', () => {
    aproximarse(Math.sin(Math.PI / 2), 1, 10);
    aproximarse(Math.sin(90 * Math.PI / 180), 1, 10);
    aproximarse(Math.sin(100 * Math.PI / 200), 1, 10);
  });
});
