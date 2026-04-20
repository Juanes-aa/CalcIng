/**
 * mathEngine.ts
 * Motor de cálculo principal. Envuelve mathjs para la evaluación y
 * provee funciones especializadas de ingeniería.
 */

import { create, all, MathJsInstance } from 'mathjs';
import { CONSTANTS } from './constants';
import { loadSettings } from './ajustes';
import {
  convertDecimalToBinary, convertDecimalToHex, convertDecimalToOctal,
  convertBinaryToDecimal, convertHexToDecimal, convertOctalToDecimal,
} from './bases';
import * as estadistica from './estadistica';
import * as complejos from './complejos';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type AngleMode = 'RAD' | 'DEG' | 'GRAD';

export interface LinearSolution {
  x: number;
}

export interface QuadraticSolutionTwoReal {
  tipo: 'dos_reales';
  x1: number;
  x2: number;
}

export interface QuadraticSolutionOneReal {
  tipo: 'una_real';
  x1: number;
}

export interface QuadraticSolutionComplex {
  tipo: 'compleja';
  x1: string;
  x2: string;
}

export interface QuadraticSolutionLinear extends LinearSolution {
  tipo: 'lineal';
}

export type QuadraticSolution =
  | QuadraticSolutionTwoReal
  | QuadraticSolutionOneReal
  | QuadraticSolutionComplex
  | QuadraticSolutionLinear;

// ─── Instancia math.js ────────────────────────────────────────────────────────

let _math: MathJsInstance = create(all);
let _ambito: Record<string, unknown> = {};
let _inicializado = false;

export function initMathEngine(instanciaMath?: MathJsInstance): void {
  _math = instanciaMath ?? create(all);
  _ambito = {};

  for (const [clave, c] of Object.entries(CONSTANTS)) {
    _ambito[clave.toLowerCase()] = c.value;
  }
  _ambito['pi']    = CONSTANTS['PI']!.value;
  _ambito['euler'] = CONSTANTS['E']!.value;

  _registrarFuncionesExtendidas();
  _inicializado = true;
}

// ─── Registro de Funciones Extendidas ────────────────────────────────────────

function _aArrayPlano(arg: unknown): number[] {
  if (Array.isArray(arg)) return (arg as unknown[]).flat(Infinity) as number[];
  if (arg && typeof (arg as Record<string, unknown>).toArray === 'function') {
    return ((arg as { toArray: () => unknown[] }).toArray()).flat(Infinity) as number[];
  }
  if (arg && typeof (arg as Record<string, unknown>)._data !== 'undefined') {
    return ((arg as { _data: unknown[] })._data).flat(Infinity) as number[];
  }
  throw new Error('Se esperaba un array de números.');
}

function _registrarFuncionesExtendidas(): void {
  _math.import({
    decToBin:  (n: number) => convertDecimalToBinary(n),
    decToHex:  (n: number) => convertDecimalToHex(n),
    decToOct:  (n: number) => convertDecimalToOctal(n),
    binToDec:  (s: string) => convertBinaryToDecimal(s),
    hexToDec:  (s: string) => convertHexToDecimal(s),
    octToDec:  (s: string) => convertOctalToDecimal(s),

    mean:       (arr: unknown) => estadistica.mean(_aArrayPlano(arr)),
    median:     (arr: unknown) => estadistica.median(_aArrayPlano(arr)),
    mode:       (arr: unknown) => estadistica.mode(_aArrayPlano(arr)),
    variance:   (arr: unknown) => estadistica.variance(_aArrayPlano(arr)),
    stdDev:     (arr: unknown) => estadistica.stdDev(_aArrayPlano(arr)),
    range:      (arr: unknown) => estadistica.range(_aArrayPlano(arr)),
    percentile: (arr: unknown, p: number) => estadistica.percentile(_aArrayPlano(arr), p),

    cAdd:       (z1: complejos.Complejo, z2: complejos.Complejo) => complejos.add(z1, z2),
    cSub:       (z1: complejos.Complejo, z2: complejos.Complejo) => complejos.subtract(z1, z2),
    cMul:       (z1: complejos.Complejo, z2: complejos.Complejo) => complejos.multiply(z1, z2),
    cDiv:       (z1: complejos.Complejo, z2: complejos.Complejo) => complejos.divide(z1, z2),
    cModulus:   (z: complejos.Complejo) => complejos.modulus(z),
    cArgument:  (z: complejos.Complejo) => complejos.argument(z),
    cConjugate: (z: complejos.Complejo) => complejos.conjugate(z),
    cPower:     (z: complejos.Complejo, n: number) => complejos.power(z, n),
    cSqrt:      (z: complejos.Complejo) => complejos.sqrt(z),
  }, { override: true });
}

// ─── Solucionadores ───────────────────────────────────────────────────────────

export function solveLinear(a: number, b: number): LinearSolution {
  if (a === 0) throw new Error('El coeficiente "a" no puede ser cero en una ecuación lineal.');
  return { x: -b / a };
}

export function solveQuadratic(a: number, b: number, c: number): QuadraticSolution {
  if (a === 0) return { ...solveLinear(b, c), tipo: 'lineal' };
  const discriminante = b * b - 4 * a * c;

  if (discriminante > 0) {
    return {
      tipo: 'dos_reales',
      x1: (-b + Math.sqrt(discriminante)) / (2 * a),
      x2: (-b - Math.sqrt(discriminante)) / (2 * a),
    };
  } else if (discriminante === 0) {
    return { tipo: 'una_real', x1: -b / (2 * a) };
  } else {
    const parteReal = -b / (2 * a);
    const parteImag = Math.sqrt(-discriminante) / (2 * a);
    return {
      tipo: 'compleja',
      x1: `${parteReal.toFixed(6)} + ${parteImag.toFixed(6)}i`,
      x2: `${parteReal.toFixed(6)} - ${parteImag.toFixed(6)}i`,
    };
  }
}

// ─── Funciones Numéricas ──────────────────────────────────────────────────────

export function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) throw new Error('El factorial requiere un entero no negativo.');
  if (n > 170) throw new Error('Desbordamiento factorial (n > 170).');
  let resultado = 1;
  for (let i = 2; i <= n; i++) resultado *= i;
  return resultado;
}

export function toEngineeringNotation(valor: number, precision = 3): string {
  if (valor === 0) return '0';
  const signo = valor < 0 ? '-' : '';
  const abs   = Math.abs(valor);
  const exp   = Math.floor(Math.log10(abs));
  const expIng = Math.floor(exp / 3) * 3;
  const mantisa = abs / Math.pow(10, expIng);
  return `${signo}${mantisa.toFixed(precision)}×10^${expIng}`;
}

// ─── Evaluador Principal ──────────────────────────────────────────────────────

export function evaluate(expresion: string, modoAngulo: AngleMode | boolean = 'RAD'): string {
  if (!_inicializado) initMathEngine();
  if (!expresion || expresion.trim() === '') return '';

  try {
    const expr = preprocesarExpresion(expresion, modoAngulo);
    const resultado = _math.evaluate(expr, { ..._ambito });

    if (_math.typeOf(resultado) === 'Matrix') {
      return formatearMatrizMathJs(resultado as { toArray: () => unknown[] });
    }

    if (typeof resultado === 'object' && resultado !== null &&
        'real' in resultado && resultado.real !== undefined) {
      const r = resultado as { real: number; imag: number };
      const prec = loadSettings().precision;
      const re = +r.real.toFixed(prec);
      const im = +r.imag.toFixed(prec);
      if (im === 0) return formatearNumero(re);
      return `${formatearNumero(re)} ${im >= 0 ? '+' : '-'} ${formatearNumero(Math.abs(im))}i`;
    }

    if (typeof resultado === 'boolean') return resultado.toString();
    if (typeof resultado === 'number') {
      if (!isFinite(resultado)) return resultado > 0 ? 'Infinito' : resultado < 0 ? '-Infinito' : 'Indefinido';
      if (isNaN(resultado)) return 'Indefinido';
      return formatearNumero(resultado);
    }

    return String(resultado);

  } catch (err) {
    return clasificarError((err as Error).message);
  }
}

// ─── Preprocesamiento ─────────────────────────────────────────────────────────

function preprocesarExpresion(expr: string, modoAngulo: AngleMode | boolean): string {
  if (modoAngulo === true)  modoAngulo = 'DEG';
  if (modoAngulo === false) modoAngulo = 'RAD';

  let e = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi')
    .replace(/\^/g, '^')
    .replace(/(\d)(pi|e\b)/g, '$1*$2')
    .replace(/(pi|e\b)(\d)/g, '$1*$2');

  if (modoAngulo === 'DEG' || modoAngulo === 'GRAD') {
    const TRIG_DIRECTAS = ['sin', 'cos', 'tan', 'sinh', 'cosh', 'tanh'];
    for (const fn of TRIG_DIRECTAS) {
      const re = new RegExp(`\\b${fn}\\(`, 'g');
      e = e.replace(re, `_TRIG_${fn.toUpperCase()}_(`);
    }

    const TRIG_INVERSAS = ['asin', 'acos', 'atan'];
    for (const fn of TRIG_INVERSAS) {
      const re = new RegExp(`\\b${fn}\\(`, 'g');
      e = e.replace(re, `_RAD2ANG_(${fn}(`);
    }

    e = _expandirMarcadoresAngulo(e, modoAngulo as 'DEG' | 'GRAD');
  }

  return e;
}

function _expandirMarcadoresAngulo(expr: string, modoAngulo: 'DEG' | 'GRAD'): string {
  const factorEntrada = modoAngulo === 'GRAD' ? 'pi / 200' : 'pi / 180';
  const factorSalida  = modoAngulo === 'GRAD' ? '200 / pi' : '180 / pi';

  const NOMBRES = ['sin', 'cos', 'tan', 'sinh', 'cosh', 'tanh'];
  for (const fn of NOMBRES) {
    const marcador = `_TRIG_${fn.toUpperCase()}_(`;
    expr = _envolverMarcador(expr, marcador, (inner) => `${fn}((${inner}) * ${factorEntrada})`);
  }

  expr = _envolverMarcador(expr, '_RAD2ANG_(', (inner) => `((${inner}) * ${factorSalida})`);
  return expr;
}

function _envolverMarcador(expr: string, marcador: string, wrapper: (inner: string) => string): string {
  let resultado = '';
  let i = 0;

  while (i < expr.length) {
    const idx = expr.indexOf(marcador, i);
    if (idx === -1) {
      resultado += expr.slice(i);
      break;
    }

    resultado += expr.slice(i, idx);
    let pos = idx + marcador.length;
    let profundidad = 1;
    const inicio = pos;

    while (pos < expr.length && profundidad > 0) {
      if (expr[pos] === '(') profundidad++;
      else if (expr[pos] === ')') profundidad--;
      pos++;
    }

    const inner = expr.slice(inicio, pos - 1);
    resultado += wrapper(inner);
    i = pos;
  }

  return resultado;
}

// ─── Formateo ─────────────────────────────────────────────────────────────────

export function formatearNumero(n: number): string {
  const { precision, sciNotation } = loadSettings();

  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();

  const absN = Math.abs(n);

  // Notación científica automática (si está activada) para n > 1e9 o n < 1e-6
  if (sciNotation && (absN >= 1e9 || (absN < 1e-6 && n !== 0))) {
    return n.toPrecision(precision).replace(/\.?0+e/, 'e');
  }

  // Fallback: números extremos siempre usan notación exponencial
  if (absN >= 1e15 || (absN < 1e-6 && n !== 0)) {
    return n.toPrecision(precision).replace(/\.?0+e/, 'e');
  }

  return parseFloat(n.toPrecision(precision)).toString();
}

export const formatNumber = formatearNumero;

function formatearMatrizMathJs(m: { toArray: () => unknown[] }): string {
  const arr = m.toArray();
  return arr.map(fila =>
    Array.isArray(fila)
      ? '[' + (fila as number[]).map(v => formatearNumero(v)).join(', ') + ']'
      : formatearNumero(fila as number)
  ).join('\n');
}

// ─── Clasificación de Errores ─────────────────────────────────────────────────

function clasificarError(msg: string): string {
  if (!msg) return 'Error';
  const m = msg.toLowerCase();
  if (m.includes('divide by zero') || m.includes('division by zero')) return 'Indefinido';
  if (m.includes('undefined') || m.includes('is not defined'))         return 'Error de Sintaxis';
  if (m.includes('unexpected'))                                         return 'Error de Sintaxis';
  if (m.includes('parenthesis') || m.includes('bracket'))              return 'Error de Sintaxis';
  return 'Error de Sintaxis';
}
