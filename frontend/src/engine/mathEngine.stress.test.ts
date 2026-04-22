import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, saveSettings } from './ajustes';
import { evaluate, initMathEngine } from './mathEngine';

function asNumber(result: string): number {
  return Number.parseFloat(result);
}

describe('mathEngine stress', () => {
  beforeEach(() => {
    localStorage.clear();
    saveSettings({ ...DEFAULT_SETTINGS });
    initMathEngine();
  });

  it('resuelve sin(90) en DEG con precision alta', () => {
    expect(asNumber(evaluate('sin(90)', 'DEG'))).toBeCloseTo(1, 12);
  });

  it('resuelve cos(60) en DEG con precision alta', () => {
    expect(asNumber(evaluate('cos(60)', 'DEG'))).toBeCloseTo(0.5, 12);
  });

  it('resuelve tan(45) en DEG con precision alta', () => {
    expect(asNumber(evaluate('tan(45)', 'DEG'))).toBeCloseTo(1, 10);
  });

  it('resuelve sin(100) en GRAD con precision alta', () => {
    expect(asNumber(evaluate('sin(100)', 'GRAD'))).toBeCloseTo(1, 12);
  });

  it('resuelve asin(1) en DEG con precision alta', () => {
    expect(asNumber(evaluate('asin(1)', 'DEG'))).toBeCloseTo(90, 10);
  });

  it('resuelve acos(0) en DEG con precision alta', () => {
    expect(asNumber(evaluate('acos(0)', 'DEG'))).toBeCloseTo(90, 10);
  });

  it('resuelve atan(1) en DEG con precision alta', () => {
    expect(asNumber(evaluate('atan(1)', 'DEG'))).toBeCloseTo(45, 10);
  });

  it('mantiene la identidad trigonometrica en DEG', () => {
    expect(asNumber(evaluate('sin(30)^2 + cos(30)^2', 'DEG'))).toBeCloseTo(1, 10);
  });

  it('controla bien el error flotante clasico 0.1 + 0.2', () => {
    expect(asNumber(evaluate('0.1 + 0.2'))).toBeCloseTo(0.3, 12);
  });

  it('aproxima 1/3 con 12 digitos de precision', () => {
    expect(asNumber(evaluate('1/3'))).toBeCloseTo(1 / 3, 12);
  });

  it('mantiene consistencia numerica en sqrt(2)^2', () => {
    expect(asNumber(evaluate('sqrt(2)^2'))).toBeCloseTo(2, 10);
  });

  it('calcula mean sobre una muestra ordenada', () => {
    expect(asNumber(evaluate('mean([1,2,3,4,5])'))).toBeCloseTo(3, 12);
  });

  it('calcula median sobre una muestra desordenada', () => {
    expect(asNumber(evaluate('median([9,1,5,3,7])'))).toBeCloseTo(5, 12);
  });

  it('calcula variance poblacional con precision estable', () => {
    expect(asNumber(evaluate('variance([1,2,3,4,5])'))).toBeCloseTo(2, 12);
  });

  it('calcula stdDev poblacional con precision estable', () => {
    expect(asNumber(evaluate('stdDev([1,2,3,4,5])'))).toBeCloseTo(Math.sqrt(2), 10);
  });

  it('convierte 255 a hexadecimal exacto', () => {
    expect(evaluate('decToHex(255)')).toBe('FF');
  });

  it('convierte -42 a binario exacto', () => {
    expect(evaluate('decToBin(-42)')).toBe('-101010');
  });

  it('sostiene factorial(20) sin perder magnitud', () => {
    const result = asNumber(evaluate('factorial(20)'));
    const expected = 2432902008176640000;
    expect(Math.abs(result - expected) / expected).toBeLessThan(1e-10);
  });

  it('clasifica 1/0 como infinito positivo', () => {
    expect(evaluate('1/0')).toBe('Infinito');
  });

  it('clasifica 0/0 como indefinido', () => {
    expect(evaluate('0/0')).toBe('Indefinido');
  });
});
