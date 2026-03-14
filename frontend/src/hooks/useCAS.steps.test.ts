import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCAS } from './useCAS';
import type { CASEngine, CASResult } from '@engine/cas/casEngine';
import * as stepBuilderModule from '@engine/stepEngine/stepBuilder';

// ─── Mock engine que siempre retorna success ──────────────────────────────────

const mockEngine: CASEngine = {
  simplify:      vi.fn(async (): Promise<CASResult> => ({ status: 'success', result: '2*x' })),
  differentiate: vi.fn(async (): Promise<CASResult> => ({ status: 'success', result: '2*x' })),
  integrate:     vi.fn(async (): Promise<CASResult> => ({ status: 'success', result: '2*x' })),
  solveEquation: vi.fn(async (): Promise<CASResult> => ({ status: 'success', result: '2*x' })),
  expand:        vi.fn(async (): Promise<CASResult> => ({ status: 'success', result: '2*x' })),
  factor:        vi.fn(async (): Promise<CASResult> => ({ status: 'success', result: '2*x' })),
};

const errorEngine: CASEngine = {
  simplify:      vi.fn(async (): Promise<CASResult> => ({ status: 'error', code: 'ERR', message: 'fallo', originalExpression: 'x' })),
  differentiate: vi.fn(async (): Promise<CASResult> => ({ status: 'error', code: 'ERR', message: 'fallo', originalExpression: 'x' })),
  integrate:     vi.fn(async (): Promise<CASResult> => ({ status: 'error', code: 'ERR', message: 'fallo', originalExpression: 'x' })),
  solveEquation: vi.fn(async (): Promise<CASResult> => ({ status: 'error', code: 'ERR', message: 'fallo', originalExpression: 'x' })),
  expand:        vi.fn(async (): Promise<CASResult> => ({ status: 'error', code: 'ERR', message: 'fallo', originalExpression: 'x' })),
  factor:        vi.fn(async (): Promise<CASResult> => ({ status: 'error', code: 'ERR', message: 'fallo', originalExpression: 'x' })),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('useCAS — steps integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('steps arranca como array vacío', () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    expect(result.current.steps).toEqual([]);
  });

  it('después de execute() exitoso, steps.length > 0', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => { result.current.setExpression('x^2'); });
    await act(async () => { await result.current.execute(); });
    expect(result.current.steps.length).toBeGreaterThan(0);
  });

  it('después de execute() exitoso, steps[0] tiene step_number === 1', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => { result.current.setExpression('x^2'); });
    await act(async () => { await result.current.execute(); });
    expect(result.current.steps[0].step_number).toBe(1);
  });

  it('todos los steps tienen rule_name no vacío', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => { result.current.setExpression('x^2'); });
    await act(async () => { await result.current.execute(); });
    for (const step of result.current.steps) {
      expect(step.rule_name).toBeTruthy();
    }
  });

  it('después de reset(), steps vuelve a []', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => { result.current.setExpression('x^2'); });
    await act(async () => { await result.current.execute(); });
    expect(result.current.steps.length).toBeGreaterThan(0);
    act(() => { result.current.reset(); });
    expect(result.current.steps).toEqual([]);
  });

  it('después de execute() con error del engine, steps queda como []', async () => {
    const { result } = renderHook(() => useCAS(errorEngine));
    act(() => { result.current.setExpression('x'); });
    await act(async () => { await result.current.execute(); });
    expect(result.current.steps).toEqual([]);
  });

  it('el StepInput pasado a buildSteps tiene operation, expression y result correctos', async () => {
    const spy = vi.spyOn(stepBuilderModule, 'buildSteps');

    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => {
      result.current.setExpression('x^2');
      result.current.setOperation('differentiate');
    });
    await act(async () => { await result.current.execute(); });

    expect(spy).toHaveBeenCalledOnce();
    const calledWith = spy.mock.calls[0][0];
    expect(calledWith.operation).toBe('differentiate');
    expect(calledWith.expression).toBe('x^2');
    expect(calledWith.result).toBe('2*x');
  });
});