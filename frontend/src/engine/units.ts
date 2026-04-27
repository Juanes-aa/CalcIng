/**
 * units.ts
 * Motor de conversión de unidades.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface UnitEntry {
  label: string;
  labelEn: string;
  factor?: number;
}

export interface UnitCategory {
  label: string;
  labelEn: string;
  base: string;
  units: Record<string, UnitEntry>;
}

// ─── Tablas de Conversión ─────────────────────────────────────────────────────

export const UNITS: Record<string, UnitCategory> = {
  longitud: {
    label: 'Longitud', labelEn: 'Length', base: 'm',
    units: {
      m:   { label: 'Metro (m)',          labelEn: 'Meter (m)',            factor: 1 },
      km:  { label: 'Kilómetro (km)',     labelEn: 'Kilometer (km)',       factor: 1e3 },
      cm:  { label: 'Centímetro (cm)',    labelEn: 'Centimeter (cm)',      factor: 1e-2 },
      mm:  { label: 'Milímetro (mm)',     labelEn: 'Millimeter (mm)',      factor: 1e-3 },
      um:  { label: 'Micrómetro (μm)',    labelEn: 'Micrometer (μm)',      factor: 1e-6 },
      nm:  { label: 'Nanómetro (nm)',     labelEn: 'Nanometer (nm)',       factor: 1e-9 },
      in:  { label: 'Pulgada (in)',       labelEn: 'Inch (in)',            factor: 0.0254 },
      ft:  { label: 'Pie (ft)',           labelEn: 'Foot (ft)',            factor: 0.3048 },
      yd:  { label: 'Yarda (yd)',         labelEn: 'Yard (yd)',            factor: 0.9144 },
      mi:  { label: 'Milla (mi)',         labelEn: 'Mile (mi)',            factor: 1609.344 },
      nmi: { label: 'Milla Náutica',      labelEn: 'Nautical Mile',        factor: 1852 },
      au:  { label: 'Unidad Astronómica', labelEn: 'Astronomical Unit',    factor: 1.495978707e11 },
      ly:  { label: 'Año Luz',            labelEn: 'Light Year',           factor: 9.4607304725808e15 },
    },
  },
  masa: {
    label: 'Masa', labelEn: 'Mass', base: 'kg',
    units: {
      kg:  { label: 'Kilogramo (kg)',     labelEn: 'Kilogram (kg)',        factor: 1 },
      g:   { label: 'Gramo (g)',          labelEn: 'Gram (g)',             factor: 1e-3 },
      mg:  { label: 'Miligramo (mg)',     labelEn: 'Milligram (mg)',       factor: 1e-6 },
      t:   { label: 'Tonelada (t)',       labelEn: 'Ton (t)',              factor: 1e3 },
      lb:  { label: 'Libra (lb)',         labelEn: 'Pound (lb)',           factor: 0.45359237 },
      oz:  { label: 'Onza (oz)',          labelEn: 'Ounce (oz)',           factor: 0.028349523125 },
      st:  { label: 'Stone (st)',         labelEn: 'Stone (st)',           factor: 6.35029318 },
      ug:  { label: 'Microgramo (μg)',    labelEn: 'Microgram (μg)',       factor: 1e-9 },
    },
  },
  temperatura: {
    label: 'Temperatura', labelEn: 'Temperature', base: 'K',
    units: {
      K:  { label: 'Kelvin (K)',          labelEn: 'Kelvin (K)' },
      C:  { label: 'Celsius (°C)',        labelEn: 'Celsius (°C)' },
      F:  { label: 'Fahrenheit (°F)',     labelEn: 'Fahrenheit (°F)' },
      R:  { label: 'Rankine (°R)',        labelEn: 'Rankine (°R)' },
    },
  },
  energia: {
    label: 'Energía', labelEn: 'Energy', base: 'J',
    units: {
      J:    { label: 'Julio (J)',         labelEn: 'Joule (J)',            factor: 1 },
      kJ:   { label: 'Kilojulio (kJ)',    labelEn: 'Kilojoule (kJ)',       factor: 1e3 },
      MJ:   { label: 'Megajulio (MJ)',    labelEn: 'Megajoule (MJ)',       factor: 1e6 },
      cal:  { label: 'Caloría (cal)',     labelEn: 'Calorie (cal)',        factor: 4.184 },
      kcal: { label: 'Kilocaloría',       labelEn: 'Kilocalorie',          factor: 4184 },
      Wh:   { label: 'Vatio-hora (Wh)',   labelEn: 'Watt-hour (Wh)',       factor: 3600 },
      kWh:  { label: 'kWh',              labelEn: 'kWh',                  factor: 3.6e6 },
      eV:   { label: 'Electrón-voltio',   labelEn: 'Electron-volt',        factor: 1.602176634e-19 },
      BTU:  { label: 'BTU',              labelEn: 'BTU',                  factor: 1055.06 },
      erg:  { label: 'Ergio',            labelEn: 'Erg',                  factor: 1e-7 },
    },
  },
  presion: {
    label: 'Presión', labelEn: 'Pressure', base: 'Pa',
    units: {
      Pa:   { label: 'Pascal (Pa)',       labelEn: 'Pascal (Pa)',          factor: 1 },
      kPa:  { label: 'Kilopascal',       labelEn: 'Kilopascal',           factor: 1e3 },
      MPa:  { label: 'Megapascal',       labelEn: 'Megapascal',           factor: 1e6 },
      bar:  { label: 'Bar',              labelEn: 'Bar',                  factor: 1e5 },
      atm:  { label: 'Atmósfera',        labelEn: 'Atmosphere',           factor: 101325 },
      psi:  { label: 'PSI',              labelEn: 'PSI',                  factor: 6894.757 },
      torr: { label: 'Torr (mmHg)',      labelEn: 'Torr (mmHg)',          factor: 133.322 },
      mmHg: { label: 'mmHg',            labelEn: 'mmHg',                 factor: 133.322 },
    },
  },
  tiempo: {
    label: 'Tiempo', labelEn: 'Time', base: 's',
    units: {
      s:   { label: 'Segundo (s)',        labelEn: 'Second (s)',           factor: 1 },
      ms:  { label: 'Milisegundo (ms)',   labelEn: 'Millisecond (ms)',     factor: 1e-3 },
      us:  { label: 'Microsegundo (μs)',  labelEn: 'Microsecond (μs)',     factor: 1e-6 },
      ns:  { label: 'Nanosegundo (ns)',   labelEn: 'Nanosecond (ns)',      factor: 1e-9 },
      min: { label: 'Minuto (min)',       labelEn: 'Minute (min)',         factor: 60 },
      h:   { label: 'Hora (h)',           labelEn: 'Hour (h)',             factor: 3600 },
      dia: { label: 'Día',               labelEn: 'Day',                  factor: 86400 },
      sem: { label: 'Semana',            labelEn: 'Week',                 factor: 604800 },
      mes: { label: 'Mes (promedio)',     labelEn: 'Month (average)',      factor: 2629800 },
      ano: { label: 'Año',               labelEn: 'Year',                 factor: 31557600 },
    },
  },
  velocidad: {
    label: 'Velocidad', labelEn: 'Speed', base: 'm/s',
    units: {
      ms:  { label: 'm/s',               labelEn: 'm/s',                  factor: 1 },
      kmh: { label: 'km/h',              labelEn: 'km/h',                 factor: 1/3.6 },
      mph: { label: 'mph',               labelEn: 'mph',                  factor: 0.44704 },
      kt:  { label: 'Nudo (kt)',         labelEn: 'Knot (kt)',            factor: 0.514444 },
      c:   { label: 'Vel. de la Luz',    labelEn: 'Speed of Light',       factor: 299792458 },
    },
  },
  angulo: {
    label: 'Ángulo', labelEn: 'Angle', base: 'rad',
    units: {
      rad:  { label: 'Radián (rad)',      labelEn: 'Radian (rad)',         factor: 1 },
      deg:  { label: 'Grado (°)',         labelEn: 'Degree (°)',           factor: Math.PI / 180 },
      grad: { label: 'Gradián (grad)',    labelEn: 'Gradian (grad)',       factor: Math.PI / 200 },
      rev:  { label: 'Revolución',        labelEn: 'Revolution',           factor: 2 * Math.PI },
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
