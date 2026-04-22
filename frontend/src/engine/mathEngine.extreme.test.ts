import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, saveSettings } from './ajustes';
import { evaluate, initMathEngine } from './mathEngine';

function asNumber(result: string): number {
  return Number.parseFloat(result);
}

describe('mathEngine extreme', () => {
  beforeEach(() => {
    localStorage.clear();
    saveSettings({ ...DEFAULT_SETTINGS });
    initMathEngine();
  });

  it('mantiene identidad trigonometrica compuesta en DEG', () => {
    expect(asNumber(evaluate('sin(45)^2 + cos(45)^2', 'DEG'))).toBeCloseTo(1, 10);
  });

  it('compone sin(asin(0.25)) correctamente en RAD', () => {
    expect(asNumber(evaluate('sin(asin(0.25))'))).toBeCloseTo(0.25, 10);
  });

  it('compone exp(ln(7)) correctamente', () => {
    expect(asNumber(evaluate('exp(ln(7))'))).toBeCloseTo(7, 10);
  });

  it('evalua abs con precision decimal', () => {
    expect(asNumber(evaluate('abs(-123.456)'))).toBeCloseTo(123.456, 12);
  });

  it('evalua ceil con negativos correctamente', () => {
    expect(asNumber(evaluate('ceil(-2.1)'))).toBeCloseTo(-2, 12);
  });

  it('evalua floor con negativos correctamente', () => {
    expect(asNumber(evaluate('floor(-2.1)'))).toBeCloseTo(-3, 12);
  });

  it('evalua mod con enteros positivos', () => {
    expect(asNumber(evaluate('mod(29,5)'))).toBeCloseTo(4, 12);
  });

  it('aplana matrices al calcular mean', () => {
    expect(asNumber(evaluate('mean([[1,2],[3,4]])'))).toBeCloseTo(2.5, 12);
  });

  it('calcula range con datos mixtos', () => {
    expect(asNumber(evaluate('range([10,-2,8,4])'))).toBeCloseTo(12, 12);
  });

  it('calcula percentile con interpolacion correcta', () => {
    expect(asNumber(evaluate('percentile([1,2,3,4,5],75)'))).toBeCloseTo(4, 12);
  });

  it('variance de una muestra constante es cero', () => {
    expect(asNumber(evaluate('variance([2,2,2,2])'))).toBeCloseTo(0, 12);
  });

  it('stdDev de una muestra constante es cero', () => {
    expect(asNumber(evaluate('stdDev([1,1,1,1])'))).toBeCloseTo(0, 12);
  });

  it('convierte 511 a octal exacto', () => {
    expect(evaluate('decToOct(511)')).toBe('777');
  });

  it('convierte 1023 a binario exacto', () => {
    expect(evaluate('decToBin(1023)')).toBe('1111111111');
  });

  it('muestra notacion cientifica para magnitudes grandes', () => {
    expect(evaluate('10^15')).toContain('e');
  });

  it('muestra notacion cientifica para magnitudes pequenas', () => {
    expect(evaluate('10^-9')).toContain('e');
  });

  it('formatea correctamente una raiz compleja pura', () => {
    const result = evaluate('sqrt(-4)');
    expect(result).toContain('2');
    expect(result).toContain('i');
  });

  it('mantiene precision en una cancelacion numerica delicada', () => {
    expect(asNumber(evaluate('(sqrt(10000000001) - 100000) * (sqrt(10000000001) + 100000)'))).toBeCloseTo(1, 5);
  });

  it('clasifica overflow factorial como error de sintaxis del motor', () => {
    expect(evaluate('factorial(171)')).toBe('Error de Sintaxis');
  });

  it('clasifica entrada malformada como error de sintaxis', () => {
    expect(evaluate('sin(')).toBe('Error de Sintaxis');
  });
});
