import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildSteps } from './stepBuilder';
import { RULE_BOOK } from './ruleBook';
import { useCAS } from '@/hooks/useCAS';

function expectConsecutiveStepNumbers(stepNumbers: number[]): void {
  expect(stepNumbers).toEqual(stepNumbers.map((_, index) => index + 1));
}

describe('stepBuilder precision', () => {
  it('genera linealidad al derivar una suma', () => {
    const steps = buildSteps({
      operation: 'differentiate',
      expression: 'x^2 + 3*x + 1',
      variable: 'x',
      result: '2*x + 3',
    });

    expect(steps[0]?.rule_id).toBe('SUM_RULE_DIFF');
    expect(steps.at(-1)?.expression_after).toBe('2*x + 3');
  });

  it('incluye regla de producto cuando corresponde', () => {
    const steps = buildSteps({
      operation: 'differentiate',
      expression: 'x*sin(x)',
      variable: 'x',
      result: 'sin(x) + x*cos(x)',
    });

    expect(steps.some((step) => step.rule_id === 'PRODUCT_RULE_DIFF')).toBe(true);
  });

  it('incluye regla de la cadena cuando corresponde', () => {
    const steps = buildSteps({
      operation: 'differentiate',
      expression: 'sin(x^2)',
      variable: 'x',
      result: '2*x*cos(x^2)',
    });

    expect(steps.some((step) => step.rule_id === 'CHAIN_RULE_DIFF')).toBe(true);
  });

  it('incluye regla de constante para una derivada de constante', () => {
    const steps = buildSteps({
      operation: 'differentiate',
      expression: '7',
      variable: 'x',
      result: '0',
    });

    expect(steps.some((step) => step.rule_id === 'CONST_RULE_DIFF')).toBe(true);
    expect(steps.at(-1)?.expression_after).toBe('0');
  });

  it('numera los pasos de derivacion de forma consecutiva', () => {
    const steps = buildSteps({
      operation: 'differentiate',
      expression: 'x^3 + sin(x)',
      variable: 'x',
      result: '3*x^2 + cos(x)',
    });

    expectConsecutiveStepNumbers(steps.map((step) => step.step_number));
  });

  it('marca solo el ultimo paso de derivacion como clave', () => {
    const steps = buildSteps({
      operation: 'differentiate',
      expression: 'x^2 + 1',
      variable: 'x',
      result: '2*x',
    });

    const keySteps = steps.filter((step) => step.is_key_step);
    expect(keySteps).toHaveLength(1);
    expect(keySteps[0]).toBe(steps.at(-1));
  });

  it('la integral directa genera 2 pasos y agrega constante C', () => {
    const steps = buildSteps({
      operation: 'integrate',
      expression: 'x^2',
      variable: 'x',
      result: 'x^3/3',
    });

    expect(steps).toHaveLength(2);
    expect(steps[0]?.rule_id).toBe('DIRECT_INTEGRAL_TABLE');
    expect(steps[1]?.expression_after).toBe('x^3/3 + C');
  });

  it('la sustitucion u genera 3 pasos y el paso clave es el segundo', () => {
    const steps = buildSteps({
      operation: 'integrate',
      expression: 'x^2*sin(x^3)',
      variable: 'x',
      result: '-cos(x^3)/3',
    });

    expect(steps).toHaveLength(3);
    expect(steps[0]?.rule_id).toBe('U_SUBSTITUTION');
    expect(steps[1]?.is_key_step).toBe(true);
  });

  it('la integracion por partes genera 5 pasos y menciona ILATE', () => {
    const steps = buildSteps({
      operation: 'integrate',
      expression: 'x*cos(x)',
      variable: 'x',
      result: 'x*sin(x) + cos(x)',
    });

    expect(steps).toHaveLength(5);
    expect(steps[1]?.explanation).toContain('ILATE');
    expect(steps.at(-1)?.expression_after).toBe('x*sin(x) + cos(x) + C');
  });

  it('la integracion por partes deja el cuarto paso como paso clave', () => {
    const steps = buildSteps({
      operation: 'integrate',
      expression: 'x*exp(x)',
      variable: 'x',
      result: 'x*exp(x) - exp(x)',
    });

    expect(steps[3]?.is_key_step).toBe(true);
    expect(steps.filter((step) => step.is_key_step)).toHaveLength(1);
  });

  it('resolver ecuacion lineal genera verificacion final', () => {
    const steps = buildSteps({
      operation: 'solveEquation',
      expression: '2x + 7 = 0',
      variable: 'x',
      result: 'x = -3.5',
    });

    expect(steps).toHaveLength(5);
    expect(steps.at(-1)?.rule_name).toBe('Verificación');
    expect(steps.at(-1)?.expression_after).toContain('✓');
  });

  it('resolver ecuacion lineal calcula el valor correcto de x', () => {
    const steps = buildSteps({
      operation: 'solveEquation',
      expression: '4x - 12 = 0',
      variable: 'x',
      result: 'x = 3',
    });

    expect(steps[3]?.expression_after).toContain('3');
    expect(steps.at(-1)?.explanation).toContain('= 0 ✓');
  });

  it('resolver ecuacion no lineal cae en el flujo generico', () => {
    const steps = buildSteps({
      operation: 'solveEquation',
      expression: 'x^2 - 4 = 0',
      variable: 'x',
      result: 'x = -2,  x = 2',
    });

    expect(steps).toHaveLength(4);
    expect(steps[0]?.rule_id).toBe('ADDITIVE_EQ_PROP');
    expect(steps.at(-1)?.expression_after).toBe('x = -2,  x = 2');
  });

  it('simplify usa un solo paso algebraico clave', () => {
    const steps = buildSteps({
      operation: 'simplify',
      expression: 'x + x',
      result: '2*x',
    });

    expect(steps).toHaveLength(1);
    expect(steps[0]?.rule_id).toBe('ALGEBRAIC_SIMPLIFY');
    expect(steps[0]?.is_key_step).toBe(true);
  });

  it('expand usa un solo paso de expansion', () => {
    const steps = buildSteps({
      operation: 'expand',
      expression: '(x + 1)^2',
      result: 'x^2 + 2*x + 1',
    });

    expect(steps).toHaveLength(1);
    expect(steps[0]?.rule_id).toBe('EXPAND_RULE');
  });

  it('factor usa un solo paso de factorizacion', () => {
    const steps = buildSteps({
      operation: 'factor',
      expression: 'x^2 - 1',
      result: '(x-1)*(x+1)',
    });

    expect(steps).toHaveLength(1);
    expect(steps[0]?.rule_id).toBe('FACTOR_RULE');
  });

  it('las reglas renderizables existen en RULE_BOOK', () => {
    const steps = buildSteps({
      operation: 'differentiate',
      expression: 'x^2 + 5',
      variable: 'x',
      result: '2*x',
    });

    for (const step of steps) {
      if (step.rule_id === 'Resultado final') continue;
      expect(step.rule_id in RULE_BOOK || step.rule_name === 'Resultado final').toBe(true);
    }
  });

  it('el hook useCAS alinea el paso final con el resultado formateado en solveEquation', async () => {
    const { result } = renderHook(() => useCAS());

    act(() => {
      result.current.setExpression('x^2 - 4 = 0');
      result.current.setOperation('solveEquation');
    });

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.steps.at(-1)?.expression_after).toBe(result.current.result);
  });

  it('el hook useCAS mantiene coherencia entre resultado y paso final en differentiate', async () => {
    const { result } = renderHook(() => useCAS());

    act(() => {
      result.current.setExpression('x^3');
      result.current.setOperation('differentiate');
    });

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.steps.at(-1)?.expression_after).toBe(result.current.result);
  });

  it('StepViewer puede usar la explicacion beginner del RULE_BOOK sin perder la regla', () => {
    const step = buildSteps({
      operation: 'differentiate',
      expression: 'x^2',
      variable: 'x',
      result: '2*x',
    })[0];

    expect(step?.rule_id).toBe('POWER_RULE_DIFF');
    expect(RULE_BOOK[step.rule_id]?.explanations.beginner.length).toBeGreaterThan(0);
  });
});
