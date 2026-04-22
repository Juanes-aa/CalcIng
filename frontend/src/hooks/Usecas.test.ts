import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useCAS } from './useCAS';
import type { CASEngine, CASResult } from '@engine/cas/casEngine';

const mockEngine: CASEngine = {
  simplify: vi.fn(async (expr: string): Promise<CASResult> => {
    if (expr === 'ERROR_EXPR') return { status: 'error', code: 'PARSE_ERROR', message: 'expresión inválida', originalExpression: expr };
    if (expr === 'x + x') return { status: 'success', result: '2*x' };
    return { status: 'success', result: expr };
  }),
  differentiate: vi.fn(async (expr: string, variable: string, order?: number): Promise<CASResult> => {
    if (expr === 'ERROR_EXPR') return { status: 'error', code: 'PARSE_ERROR', message: 'expresión inválida', originalExpression: expr };
    if (expr === 'x^2' && variable === 'x' && order === 2) return { status: 'success', result: '2' };
    if (expr === 'x^2' && variable === 'x') return { status: 'success', result: '2*x' };
    return { status: 'success', result: expr };
  }),
  integrate: vi.fn(async (expr: string, _variable: string): Promise<CASResult> => {
    if (expr === 'CRASH_EXPR') throw new Error('engine crash');
    if (expr === 'ERROR_EXPR') return { status: 'error', code: 'PARSE_ERROR', message: 'expresión inválida', originalExpression: expr };
    if (expr === 'x^2') return { status: 'success', result: 'x^3/3' };
    return { status: 'success', result: expr };
  }),
  solveEquation: vi.fn(async (equation: string, _variable: string): Promise<CASResult> => {
    if (equation === 'ERROR_EXPR') return { status: 'error', code: 'PARSE_ERROR', message: 'expresión inválida', originalExpression: equation };
    if (equation === 'x^2 - 4 = 0') return { status: 'success', result: '[-2,2]' };
    return { status: 'success', result: equation };
  }),
  expand: vi.fn(async (expr: string): Promise<CASResult> => {
    if (expr === 'ERROR_EXPR') return { status: 'error', code: 'PARSE_ERROR', message: 'expresión inválida', originalExpression: expr };
    if (expr === '(x+1)^2') return { status: 'success', result: 'x^2+2*x+1' };
    return { status: 'success', result: expr };
  }),
  factor: vi.fn(async (expr: string): Promise<CASResult> => {
    if (expr === 'ERROR_EXPR') return { status: 'error', code: 'PARSE_ERROR', message: 'expresión inválida', originalExpression: expr };
    if (expr === 'x^2 - 1') return { status: 'success', result: '(x-1)*(x+1)' };
    return { status: 'success', result: expr };
  }),
};

describe('useCAS', () => {
  // T01 — initial state defaults
  it('T01 — estado inicial tiene los defaults correctos', () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    expect(result.current.expression).toBe('');
    expect(result.current.variable).toBe('x');
    expect(result.current.order).toBe(1);
    expect(result.current.operation).toBe('simplify');
    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBe('');
    expect(result.current.errorMsg).toBe('');
  });

  // T02 — setExpression
  it('T02 — setExpression actualiza expression', () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => { result.current.setExpression('x^2'); });
    expect(result.current.expression).toBe('x^2');
  });

  // T03 — setVariable
  it('T03 — setVariable actualiza variable', () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => { result.current.setVariable('y'); });
    expect(result.current.variable).toBe('y');
  });

  // T04 — setOrder
  it('T04 — setOrder actualiza order', () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => { result.current.setOrder(3); });
    expect(result.current.order).toBe(3);
  });

  // T05 — setOperation
  it('T05 — setOperation actualiza operation', () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => { result.current.setOperation('integrate'); });
    expect(result.current.operation).toBe('integrate');
  });

  // T06 — execute() with empty expression
  it('T06 — execute() con expression vacío no cambia status', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    await act(async () => { await result.current.execute(); });
    expect(result.current.status).toBe('idle');
  });

  // T07 — execute() with whitespace-only expression
  it('T07 — execute() con expression de solo espacios no cambia status', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => { result.current.setExpression('   '); });
    await act(async () => { await result.current.execute(); });
    expect(result.current.status).toBe('idle');
  });

  // T08 — simplify happy path
  it('T08 — simplify: status success y result es 2*x', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => { result.current.setExpression('x + x'); });
    await act(async () => { await result.current.execute(); });
    expect(result.current.status).toBe('success');
    expect(result.current.result).toBe('2*x');
  });

  // T09 — differentiate order=1
  it('T09 — differentiate order=1: result es 2*x', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => {
      result.current.setExpression('x^2');
      result.current.setOperation('differentiate');
      result.current.setOrder(1);
    });
    await act(async () => { await result.current.execute(); });
    expect(result.current.status).toBe('success');
    expect(result.current.result).toBe('2*x');
  });

  // T10 — differentiate order=2
  it('T10 — differentiate order=2: result es 2', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => {
      result.current.setExpression('x^2');
      result.current.setOperation('differentiate');
      result.current.setOrder(2);
    });
    await act(async () => { await result.current.execute(); });
    expect(result.current.status).toBe('success');
    expect(result.current.result).toBe('2');
  });

  // T11 — integrate
  it('T11 — integrate: result es x^3/3', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => {
      result.current.setExpression('x^2');
      result.current.setOperation('integrate');
    });
    await act(async () => { await result.current.execute(); });
    expect(result.current.status).toBe('success');
    expect(result.current.result).toBe('x^3/3');
  });

  // T12 — solveEquation
  it('T12 — solveEquation: result formateado como "x = -2,  x = 2"', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => {
      result.current.setExpression('x^2 - 4 = 0');
      result.current.setOperation('solveEquation');
    });
    await act(async () => { await result.current.execute(); });
    expect(result.current.status).toBe('success');
    expect(result.current.result).toBe('x = -2,  x = 2');
  });

  // T13 — expand
  it('T13 — expand: result es x^2+2*x+1', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => {
      result.current.setExpression('(x+1)^2');
      result.current.setOperation('expand');
    });
    await act(async () => { await result.current.execute(); });
    expect(result.current.status).toBe('success');
    expect(result.current.result).toBe('x^2+2*x+1');
  });

  // T14 — factor
  it('T14 — factor: result es (x-1)*(x+1)', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => {
      result.current.setExpression('x^2 - 1');
      result.current.setOperation('factor');
    });
    await act(async () => { await result.current.execute(); });
    expect(result.current.status).toBe('success');
    expect(result.current.result).toBe('(x-1)*(x+1)');
  });

  // T15 — engine returns CASError
  it('T15 — engine retorna CASError: status error y errorMsg correcto', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => { result.current.setExpression('ERROR_EXPR'); });
    await act(async () => { await result.current.execute(); });
    expect(result.current.status).toBe('error');
    expect(result.current.errorMsg).toBe('expresión inválida');
  });

  // T16 — engine throws exception
  it('T16 — engine lanza excepción: status error y errorMsg engine crash', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => {
      result.current.setExpression('CRASH_EXPR');
      result.current.setOperation('integrate');
    });
    await act(async () => { await result.current.execute(); });
    expect(result.current.status).toBe('error');
    expect(result.current.errorMsg).toBe('engine crash');
  });

  // T17 — after error, result stays ''
  it('T17 — después de error, result sigue siendo vacío', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => { result.current.setExpression('ERROR_EXPR'); });
    await act(async () => { await result.current.execute(); });
    expect(result.current.result).toBe('');
  });

  // T18 — reset after success
  it('T18 — después de execute exitoso, reset() vuelve idle y limpia result', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => { result.current.setExpression('x + x'); });
    await act(async () => { await result.current.execute(); });
    expect(result.current.status).toBe('success');
    act(() => { result.current.reset(); });
    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBe('');
    expect(result.current.errorMsg).toBe('');
  });

  // T19 — reset does not touch expression/variable/order/operation
  it('T19 — reset() no toca expression, variable, order, operation', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => {
      result.current.setExpression('x^2');
      result.current.setVariable('y');
      result.current.setOrder(3);
      result.current.setOperation('differentiate');
    });
    act(() => { result.current.reset(); });
    expect(result.current.expression).toBe('x^2');
    expect(result.current.variable).toBe('y');
    expect(result.current.order).toBe(3);
    expect(result.current.operation).toBe('differentiate');
  });

  // T20 — reset from idle is idempotent
  it('T20 — reset() desde idle no rompe nada', () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    expect(() => act(() => { result.current.reset(); })).not.toThrow();
    expect(result.current.status).toBe('idle');
  });

  // T21 — changing operation does not clear result
  it('T21 — cambiar operation no limpia result anterior', async () => {
    const { result } = renderHook(() => useCAS(mockEngine));
    act(() => { result.current.setExpression('x + x'); });
    await act(async () => { await result.current.execute(); });
    expect(result.current.result).toBe('2*x');
    act(() => { result.current.setOperation('differentiate'); });
    expect(result.current.result).toBe('2*x');
  });

  // T22 — status 'loading' is set during operation
  it('T22 — status loading se establece durante la operación', async () => {
    let resolvePromise!: (v: CASResult) => void;
    const controlledEngine: CASEngine = {
      ...mockEngine,
      simplify: vi.fn((): Promise<CASResult> =>
        new Promise((resolve) => { resolvePromise = resolve; })
      ),
    };

    const { result } = renderHook(() => useCAS(controlledEngine));
    act(() => { result.current.setExpression('x + x'); });

    // Iniciar sin await — el Promise queda pendiente
    act(() => { result.current.execute(); });

    // Flush microtasks pendientes; el engine NO ha resuelto todavía
    await act(async () => {});
    expect(result.current.status).toBe('loading');

    // Resolver y verificar que termina en success
    await act(async () => { resolvePromise({ status: 'success', result: '2*x' }); });
    expect(result.current.status).toBe('success');
  });
});