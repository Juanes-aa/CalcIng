/**
 * units.ts
 * Motor de conversión de unidades.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UnitEntry {
  label: string;
  factor?: number;
}

interface UnitCategory {
  label: string;
  base: string;
  units: Record<string, UnitEntry>;
}

// ─── Tablas de Conversión ─────────────────────────────────────────────────────

export const UNITS: Record<string, UnitCategory> = {
  longitud: {
    label: 'Longitud', base: 'm',
    units: {
      m:   { label: 'Metro (m)',          factor: 1 },
      km:  { label: 'Kilómetro (km)',     factor: 1e3 },
      cm:  { label: 'Centímetro (cm)',    factor: 1e-2 },
      mm:  { label: 'Milímetro (mm)',     factor: 1e-3 },
      um:  { label: 'Micrómetro (μm)',    factor: 1e-6 },
      nm:  { label: 'Nanómetro (nm)',     factor: 1e-9 },
      in:  { label: 'Pulgada (in)',       factor: 0.0254 },
      ft:  { label: 'Pie (ft)',           factor: 0.3048 },
      yd:  { label: 'Yarda (yd)',         factor: 0.9144 },
      mi:  { label: 'Milla (mi)',         factor: 1609.344 },
      nmi: { label: 'Milla Náutica',      factor: 1852 },
      au:  { label: 'Unidad Astronómica', factor: 1.495978707e11 },
      ly:  { label: 'Año Luz',            factor: 9.4607304725808e15 },
    },
  },
  masa: {
    label: 'Masa', base: 'kg',
    units: {
      kg:  { label: 'Kilogramo (kg)',     factor: 1 },
      g:   { label: 'Gramo (g)',          factor: 1e-3 },
      mg:  { label: 'Miligramo (mg)',     factor: 1e-6 },
      t:   { label: 'Tonelada (t)',       factor: 1e3 },
      lb:  { label: 'Libra (lb)',         factor: 0.45359237 },
      oz:  { label: 'Onza (oz)',          factor: 0.028349523125 },
      st:  { label: 'Stone (st)',         factor: 6.35029318 },
      ug:  { label: 'Microgramo (μg)',    factor: 1e-9 },
    },
  },
  temperatura: {
    label: 'Temperatura', base: 'K',
    units: {
      K:  { label: 'Kelvin (K)' },
      C:  { label: 'Celsius (°C)' },
      F:  { label: 'Fahrenheit (°F)' },
      R:  { label: 'Rankine (°R)' },
    },
  },
  energia: {
    label: 'Energía', base: 'J',
    units: {
      J:    { label: 'Julio (J)',         factor: 1 },
      kJ:   { label: 'Kilojulio (kJ)',    factor: 1e3 },
      MJ:   { label: 'Megajulio (MJ)',    factor: 1e6 },
      cal:  { label: 'Caloría (cal)',     factor: 4.184 },
      kcal: { label: 'Kilocaloría',       factor: 4184 },
      Wh:   { label: 'Vatio-hora (Wh)',   factor: 3600 },
      kWh:  { label: 'kWh',              factor: 3.6e6 },
      eV:   { label: 'Electrón-voltio',   factor: 1.602176634e-19 },
      BTU:  { label: 'BTU',              factor: 1055.06 },
      erg:  { label: 'Ergio',            factor: 1e-7 },
    },
  },
  presion: {
    label: 'Presión', base: 'Pa',
    units: {
      Pa:   { label: 'Pascal (Pa)',       factor: 1 },
      kPa:  { label: 'Kilopascal',       factor: 1e3 },
      MPa:  { label: 'Megapascal',       factor: 1e6 },
      bar:  { label: 'Bar',              factor: 1e5 },
      atm:  { label: 'Atmósfera',        factor: 101325 },
      psi:  { label: 'PSI',              factor: 6894.757 },
      torr: { label: 'Torr (mmHg)',      factor: 133.322 },
      mmHg: { label: 'mmHg',            factor: 133.322 },
    },
  },
  tiempo: {
    label: 'Tiempo', base: 's',
    units: {
      s:   { label: 'Segundo (s)',        factor: 1 },
      ms:  { label: 'Milisegundo (ms)',   factor: 1e-3 },
      us:  { label: 'Microsegundo (μs)',  factor: 1e-6 },
      ns:  { label: 'Nanosegundo (ns)',   factor: 1e-9 },
      min: { label: 'Minuto (min)',       factor: 60 },
      h:   { label: 'Hora (h)',           factor: 3600 },
      dia: { label: 'Día',               factor: 86400 },
      sem: { label: 'Semana',            factor: 604800 },
      mes: { label: 'Mes (promedio)',     factor: 2629800 },
      ano: { label: 'Año',               factor: 31557600 },
    },
  },
  velocidad: {
    label: 'Velocidad', base: 'm/s',
    units: {
      ms:  { label: 'm/s',               factor: 1 },
      kmh: { label: 'km/h',              factor: 1/3.6 },
      mph: { label: 'mph',               factor: 0.44704 },
      kt:  { label: 'Nudo (kt)',         factor: 0.514444 },
      c:   { label: 'Vel. de la Luz',    factor: 299792458 },
    },
  },
  angulo: {
    label: 'Ángulo', base: 'rad',
    units: {
      rad:  { label: 'Radián (rad)',      factor: 1 },
      deg:  { label: 'Grado (°)',         factor: Math.PI / 180 },
      grad: { label: 'Gradián (grad)',    factor: Math.PI / 200 },
      rev:  { label: 'Revolución',        factor: 2 * Math.PI },
    },
  },
};

// ─── Ayudantes para Temperatura ───────────────────────────────────────────────

function aKelvin(valor: number, unidadOrigen: string): number {
  switch (unidadOrigen) {
    case 'K': return valor;
    case 'C': return valor + 273.15;
    case 'F': return (valor + 459.67) * (5 / 9);
    case 'R': return valor * (5 / 9);
    default:  throw new Error(`Unidad de temperatura desconocida: ${unidadOrigen}`);
  }
}

function desdeKelvin(kelvin: number, unidadDestino: string): number {
  switch (unidadDestino) {
    case 'K': return kelvin;
    case 'C': return kelvin - 273.15;
    case 'F': return kelvin * (9 / 5) - 459.67;
    case 'R': return kelvin * (9 / 5);
    default:  throw new Error(`Unidad de temperatura desconocida: ${unidadDestino}`);
  }
}

// ─── Función Principal ────────────────────────────────────────────────────────

export function convert(valor: number, desde: string, hacia: string, categoria: string): number {
  if (!UNITS[categoria]) throw new Error(`Categoría desconocida: ${categoria}`);
  if (desde === hacia)   return valor;

  if (categoria === 'temperatura') {
    const kelvin = aKelvin(valor, desde);
    return desdeKelvin(kelvin, hacia);
  }

  const unidades = UNITS[categoria]!.units;
  if (!unidades[desde]) throw new Error(`Unidad desconocida: ${desde}`);
  if (!unidades[hacia]) throw new Error(`Unidad desconocida: ${hacia}`);

  const valorBase = valor * unidades[desde]!.factor!;
  return valorBase / unidades[hacia]!.factor!;
}
