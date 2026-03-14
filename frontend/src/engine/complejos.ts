/**
 * complejos.ts
 * Operaciones con números complejos para la calculadora de ingeniería.
 * Representación: { real: number, imag: number }
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Complejo {
  real: number;
  imag: number;
}

export interface PolarComplejo {
  modulo: number;
  argumento: number;
}

// ─── Validación ───────────────────────────────────────────────────────────────

function validarComplejo(z: unknown, nombre = 'z'): asserts z is Complejo {
  if (
    !z || typeof z !== 'object' ||
    typeof (z as Complejo).real !== 'number' || typeof (z as Complejo).imag !== 'number' ||
    !isFinite((z as Complejo).real) || !isFinite((z as Complejo).imag)
  ) {
    throw new Error(`${nombre} debe ser un objeto complejo {real, imag} con valores finitos.`);
  }
}

export function complejo(real: number, imag = 0): Complejo {
  return { real, imag };
}

// ─── Operaciones Aritméticas ──────────────────────────────────────────────────

export function add(z1: Complejo, z2: Complejo): Complejo {
  validarComplejo(z1, 'z1');
  validarComplejo(z2, 'z2');
  return { real: z1.real + z2.real, imag: z1.imag + z2.imag };
}

export function subtract(z1: Complejo, z2: Complejo): Complejo {
  validarComplejo(z1, 'z1');
  validarComplejo(z2, 'z2');
  return { real: z1.real - z2.real, imag: z1.imag - z2.imag };
}

export function multiply(z1: Complejo, z2: Complejo): Complejo {
  validarComplejo(z1, 'z1');
  validarComplejo(z2, 'z2');
  return {
    real: z1.real * z2.real - z1.imag * z2.imag,
    imag: z1.real * z2.imag + z1.imag * z2.real,
  };
}

export function divide(z1: Complejo, z2: Complejo): Complejo {
  validarComplejo(z1, 'z1');
  validarComplejo(z2, 'z2');
  const denominador = z2.real * z2.real + z2.imag * z2.imag;
  if (denominador === 0) throw new Error('División por cero complejo.');
  return {
    real: (z1.real * z2.real + z1.imag * z2.imag) / denominador,
    imag: (z1.imag * z2.real - z1.real * z2.imag) / denominador,
  };
}

// ─── Propiedades ──────────────────────────────────────────────────────────────

export function modulus(z: Complejo): number {
  validarComplejo(z, 'z');
  return Math.sqrt(z.real * z.real + z.imag * z.imag);
}

export function argument(z: Complejo): number {
  validarComplejo(z, 'z');
  return Math.atan2(z.imag, z.real);
}

export function conjugate(z: Complejo): Complejo {
  validarComplejo(z, 'z');
  return { real: z.real, imag: -z.imag };
}

// ─── Operaciones Avanzadas ────────────────────────────────────────────────────

export function power(z: Complejo, n: number): Complejo {
  validarComplejo(z, 'z');
  if (typeof n !== 'number' || !Number.isInteger(n)) {
    throw new Error('El exponente debe ser un entero.');
  }
  if (n < 0 && z.real === 0 && z.imag === 0) {
    throw new Error('Potencia negativa de cero no definida.');
  }
  if (n === 0) return { real: 1, imag: 0 };

  const r = modulus(z);
  const theta = argument(z);
  const rn = Math.pow(r, n);
  const angulo = n * theta;

  return { real: rn * Math.cos(angulo), imag: rn * Math.sin(angulo) };
}

export function sqrt(z: Complejo): Complejo {
  validarComplejo(z, 'z');
  const r = modulus(z);
  if (r === 0) return { real: 0, imag: 0 };
  const parteReal = Math.sqrt((r + z.real) / 2);
  const parteImag = Math.sqrt((r - z.real) / 2);
  return { real: parteReal, imag: z.imag >= 0 ? parteImag : -parteImag };
}

export function toPolar(z: Complejo): PolarComplejo {
  return { modulo: modulus(z), argumento: argument(z) };
}

export function formatComplex(z: Complejo, decimales = 6): string {
  const re = +z.real.toFixed(decimales);
  const im = +z.imag.toFixed(decimales);
  if (im === 0) return `${re}`;
  if (re === 0) return `${im}i`;
  const signo = im >= 0 ? '+' : '-';
  return `${re} ${signo} ${Math.abs(im)}i`;
}
