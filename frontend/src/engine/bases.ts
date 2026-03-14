/**
 * bases.ts
 * Conversión de bases numéricas para la calculadora de ingeniería.
 * Soporta conversiones entre decimal, binario, hexadecimal y octal.
 * Todas las funciones soportan enteros negativos.
 */

// ─── Validación ───────────────────────────────────────────────────────────────

function validarEntero(n: number, nombre = 'n'): void {
  if (typeof n !== 'number' || !Number.isFinite(n)) {
    throw new Error(`${nombre} debe ser un número finito.`);
  }
  if (!Number.isInteger(n)) {
    throw new Error(`${nombre} debe ser un entero.`);
  }
  if (Math.abs(n) > Number.MAX_SAFE_INTEGER) {
    console.warn(`Advertencia: ${nombre} = ${n} supera Number.MAX_SAFE_INTEGER (2^53 - 1). La conversión puede ser inexacta.`);
  }
}

function validarCadenaBase(cadena: string, patron: RegExp, nombreBase: string): void {
  if (typeof cadena !== 'string' || cadena.trim() === '') {
    throw new Error(`Se requiere una cadena ${nombreBase} válida.`);
  }
  const limpio = cadena.trim().replace(/^-/, '');
  if (!patron.test(limpio)) {
    throw new Error(`Cadena ${nombreBase} inválida: "${cadena}".`);
  }
}

// ─── Decimal → Otras Bases ────────────────────────────────────────────────────

export function convertDecimalToBinary(n: number): string {
  validarEntero(n, 'n');
  if (n === 0) return '0';
  const signo = n < 0 ? '-' : '';
  return signo + Math.abs(n).toString(2);
}

export function convertDecimalToHex(n: number): string {
  validarEntero(n, 'n');
  if (n === 0) return '0';
  const signo = n < 0 ? '-' : '';
  return signo + Math.abs(n).toString(16).toUpperCase();
}

export function convertDecimalToOctal(n: number): string {
  validarEntero(n, 'n');
  if (n === 0) return '0';
  const signo = n < 0 ? '-' : '';
  return signo + Math.abs(n).toString(8);
}

// ─── Otras Bases → Decimal ────────────────────────────────────────────────────

export function convertBinaryToDecimal(cadena: string): string {
  validarCadenaBase(cadena, /^[01]+$/, 'binaria');
  const limpio = cadena.trim();
  const esNegativo = limpio.startsWith('-');
  const valor = parseInt(esNegativo ? limpio.slice(1) : limpio, 2);
  return (esNegativo ? -valor : valor).toString();
}

export function convertHexToDecimal(cadena: string): string {
  validarCadenaBase(cadena, /^[0-9a-fA-F]+$/, 'hexadecimal');
  const limpio = cadena.trim();
  const esNegativo = limpio.startsWith('-');
  const valor = parseInt(esNegativo ? limpio.slice(1) : limpio, 16);
  return (esNegativo ? -valor : valor).toString();
}

export function convertOctalToDecimal(cadena: string): string {
  validarCadenaBase(cadena, /^[0-7]+$/, 'octal');
  const limpio = cadena.trim();
  const esNegativo = limpio.startsWith('-');
  const valor = parseInt(esNegativo ? limpio.slice(1) : limpio, 8);
  return (esNegativo ? -valor : valor).toString();
}
