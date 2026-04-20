/**
 * variables.ts
 * Variables de ingeniería predefinidas agrupadas por categoría.
 * Los valores por defecto son 1 (adimensional) o 0 para variables de estado.
 */

export interface Variable {
  id: string;
  symbol: string;
  name: string;
  value: number;
  unit: string;
  category: string;
  preset: boolean;
}

export const DEFAULT_VARIABLES: Variable[] = [
  // ── Cinemática ──────────────────────────────────────────────────────────────
  { id: 't',  symbol: 't',  name: 'Tiempo',              value: 1,   unit: 's',       category: 'CINEMÁTICA',     preset: true },
  { id: 'v',  symbol: 'v',  name: 'Velocidad',           value: 1,   unit: 'm/s',     category: 'CINEMÁTICA',     preset: true },
  { id: 'a',  symbol: 'a',  name: 'Aceleración',         value: 1,   unit: 'm/s²',    category: 'CINEMÁTICA',     preset: true },
  { id: 'x',  symbol: 'x',  name: 'Posición',            value: 0,   unit: 'm',       category: 'CINEMÁTICA',     preset: true },
  { id: 'w',  symbol: 'ω',  name: 'Vel. angular',        value: 1,   unit: 'rad/s',   category: 'CINEMÁTICA',     preset: true },

  // ── Dinámica ────────────────────────────────────────────────────────────────
  { id: 'm',  symbol: 'm',  name: 'Masa',                value: 1,   unit: 'kg',      category: 'DINÁMICA',       preset: true },
  { id: 'F',  symbol: 'F',  name: 'Fuerza',              value: 1,   unit: 'N',       category: 'DINÁMICA',       preset: true },
  { id: 'Ek', symbol: 'Ek', name: 'Energía cinética',    value: 0,   unit: 'J',       category: 'DINÁMICA',       preset: true },
  { id: 'Ep', symbol: 'Ep', name: 'Energía potencial',   value: 0,   unit: 'J',       category: 'DINÁMICA',       preset: true },
  { id: 'P',  symbol: 'P',  name: 'Potencia',            value: 1,   unit: 'W',       category: 'DINÁMICA',       preset: true },

  // ── Eléctrica ───────────────────────────────────────────────────────────────
  { id: 'U',  symbol: 'U',  name: 'Tensión',             value: 1,   unit: 'V',       category: 'ELÉCTRICA',      preset: true },
  { id: 'I',  symbol: 'I',  name: 'Corriente',           value: 1,   unit: 'A',       category: 'ELÉCTRICA',      preset: true },
  { id: 'Rr', symbol: 'R',  name: 'Resistencia',         value: 1,   unit: 'Ω',       category: 'ELÉCTRICA',      preset: true },
  { id: 'C',  symbol: 'C',  name: 'Capacitancia',        value: 1,   unit: 'F',       category: 'ELÉCTRICA',      preset: true },
  { id: 'L',  symbol: 'L',  name: 'Inductancia',         value: 1,   unit: 'H',       category: 'ELÉCTRICA',      preset: true },

  // ── Geometría ───────────────────────────────────────────────────────────────
  { id: 'r',  symbol: 'r',  name: 'Radio',               value: 1,   unit: 'm',       category: 'GEOMETRÍA',      preset: true },
  { id: 'h',  symbol: 'h',  name: 'Altura',              value: 1,   unit: 'm',       category: 'GEOMETRÍA',      preset: true },
  { id: 'l',  symbol: 'l',  name: 'Longitud',            value: 1,   unit: 'm',       category: 'GEOMETRÍA',      preset: true },
  { id: 'A',  symbol: 'A',  name: 'Área',                value: 1,   unit: 'm²',      category: 'GEOMETRÍA',      preset: true },
  { id: 'V',  symbol: 'V',  name: 'Volumen',             value: 1,   unit: 'm³',      category: 'GEOMETRÍA',      preset: true },

  // ── Termodinámica ───────────────────────────────────────────────────────────
  { id: 'T',  symbol: 'T',  name: 'Temperatura',         value: 293, unit: 'K',       category: 'TERMODINÁMICA',  preset: true },
  { id: 'pp', symbol: 'p',  name: 'Presión',             value: 1,   unit: 'Pa',      category: 'TERMODINÁMICA',  preset: true },
  { id: 'rho',symbol: 'ρ',  name: 'Densidad',            value: 1,   unit: 'kg/m³',   category: 'TERMODINÁMICA',  preset: true },
  { id: 'Q',  symbol: 'Q',  name: 'Calor',               value: 0,   unit: 'J',       category: 'TERMODINÁMICA',  preset: true },
];

export const VARIABLE_CATEGORIES = [
  'CINEMÁTICA',
  'DINÁMICA',
  'ELÉCTRICA',
  'GEOMETRÍA',
  'TERMODINÁMICA',
  'PERSONALIZADAS',
] as const;
