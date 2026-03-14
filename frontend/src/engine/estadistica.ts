/**
 * estadistica.ts
 * Funciones estadísticas básicas para la calculadora de ingeniería.
 * Todas las funciones reciben un array de números y retornan un número.
 */

// ─── Validación ───────────────────────────────────────────────────────────────

function validarDatos(datos: number[]): void {
  if (!Array.isArray(datos) || datos.length === 0) {
    throw new Error('Se requiere un array de números no vacío.');
  }
  if (datos.some(v => typeof v !== 'number' || !isFinite(v))) {
    throw new Error('Todos los elementos deben ser números finitos.');
  }
}

// ─── Funciones Estadísticas ───────────────────────────────────────────────────

export function mean(datos: number[]): number {
  validarDatos(datos);
  const suma = datos.reduce((acc, v) => acc + v, 0);
  return suma / datos.length;
}

export function median(datos: number[]): number {
  validarDatos(datos);
  const ordenados = [...datos].sort((a, b) => a - b);
  const n = ordenados.length;
  const mitad = Math.floor(n / 2);
  if (n % 2 === 0) {
    return (ordenados[mitad - 1]! + ordenados[mitad]!) / 2;
  }
  return ordenados[mitad]!;
}

export function mode(datos: number[]): number {
  validarDatos(datos);
  const frecuencias = new Map<number, number>();
  let maxFrec = 0;
  let moda = datos[0]!;

  for (const v of datos) {
    const frec = (frecuencias.get(v) ?? 0) + 1;
    frecuencias.set(v, frec);
    if (frec > maxFrec) {
      maxFrec = frec;
      moda = v;
    }
  }
  return moda;
}

export function variance(datos: number[]): number {
  validarDatos(datos);
  if (datos.length === 1) return 0;
  const m = mean(datos);
  const sumaCuadrados = datos.reduce((acc, v) => acc + (v - m) ** 2, 0);
  return sumaCuadrados / datos.length;
}

export function stdDev(datos: number[]): number {
  return Math.sqrt(variance(datos));
}

export function sampleVariance(datos: number[]): number {
  validarDatos(datos);
  if (datos.length === 1) throw new Error('Se requieren al menos 2 elementos.');
  const m = mean(datos);
  return datos.reduce((acc, v) => acc + (v - m) ** 2, 0) / (datos.length - 1);
}

export function sampleStdDev(datos: number[]): number {
  return Math.sqrt(sampleVariance(datos));
}

export function allModes(datos: number[]): number[] {
  validarDatos(datos);
  const freq = new Map<number, number>();
  for (const v of datos) freq.set(v, (freq.get(v) ?? 0) + 1);
  const maxF = Math.max(...freq.values());
  return [...freq.entries()].filter(([, f]) => f === maxF).map(([v]) => v);
}

export function range(datos: number[]): number {
  validarDatos(datos);
  let min = datos[0]!;
  let max = datos[0]!;
  for (let i = 1; i < datos.length; i++) {
    if (datos[i]! < min) min = datos[i]!;
    if (datos[i]! > max) max = datos[i]!;
  }
  return max - min;
}

export function percentile(datos: number[], p: number): number {
  validarDatos(datos);
  if (typeof p !== 'number' || p < 0 || p > 100) {
    throw new Error('El percentil debe estar entre 0 y 100.');
  }
  if (datos.length === 1) return datos[0]!;

  const ordenados = [...datos].sort((a, b) => a - b);
  const n = ordenados.length;
  const indice = (p / 100) * (n - 1);
  const inferior = Math.floor(indice);
  const superior = Math.ceil(indice);

  if (inferior === superior) return ordenados[inferior]!;

  const fraccion = indice - inferior;
  return ordenados[inferior]! + fraccion * (ordenados[superior]! - ordenados[inferior]!);
}
