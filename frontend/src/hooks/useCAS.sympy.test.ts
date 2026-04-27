import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCAS } from './useCAS';
import type { CASEngine, CASResult } from '@engine/cas/casEngine';

function makeMockEngine(): CASEngine {
  const success = (result: string): CASResult => ({ status: 'success', result });
  return {
    simplify: vi.fn().mockResolvedValue(success('2*x')),
    differentiate: vi.fn().mockResolvedValue(success('2*x')),
    integrate: vi.fn().mockResolvedValue(success('x**3/3')),
    solveEquation: vi.fn().mockResolvedValue(success('[2, 3]')),
    expand: vi.fn().mockResolvedValue(success('x**2 + 2*x + 1')),
    factor: vi.fn().mockResolvedValue(success('(x-2)*(x-3)')),
  };
}

describe('useCAS with mocked sympyAdapter', () => {
  it('executes simplify via injected engine', async () => {
    const engine = makeMockEngine();
    const { result } = renderHook(() => useCAS(engine));

    act(() => result.current.setExpression('x + x'));

    await act(async () => {
      await result.current.execute('simplify');
    });

    expect(result.current.status).toBe('success');
    expect(result.current.result).toContain('2');
    expect(engine.simplify).toHaveBeenCalledWith('x + x');
  });

  it('executes differentiate via injected engine', async () => {
    const engine = makeMockEngine();
    const { result } = renderHook(() => useCAS(engine));

    act(() => {
      result.current.setExpression('x**2');
      result.current.setVariable('x');
    });

    await act(async () => {
      await result.current.execute('differentiate');
    });

    expect(result.current.status).toBe('success');
    expect(engine.differentiate).toHaveBeenCalledWith('x**2', 'x', 1);
  });

  it('executes integrate via injected engine', async () => {
    const engine = makeMockEngine();
    const { result } = renderHook(() => useCAS(engine));

    act(() => {
      result.current.setExpression('x**2');
      result.current.setVariable('x');
    });

    await act(async () => {
      await result.current.execute('integrate');
    });

    expect(result.current.status).toBe('success');
    expect(engine.integrate).toHaveBeenCalledWith('x**2', 'x');
  });

  it('executes expand via injected engine', async () => {
    const engine = makeMockEngine();
    const { result } = renderHook(() => useCAS(engine));

    act(() => result.current.setExpression('(x+1)**2'));

    await act(async () => {
      await result.current.execute('expand');
    });

    expect(result.current.status).toBe('success');
    expect(engine.expand).toHaveBeenCalledWith('(x+1)**2');
  });

  it('executes factor via injected engine', async () => {
    const engine = makeMockEngine();
    const { result } = renderHook(() => useCAS(engine));

    act(() => result.current.setExpression('x**2 - 5*x + 6'));

    await act(async () => {
      await result.current.execute('factor');
    });

    expect(result.current.status).toBe('success');
    expect(engine.factor).toHaveBeenCalledWith('x**2 - 5*x + 6');
  });

  it('executes solveEquation via injected engine', async () => {
    const engine = makeMockEngine();
    const { result } = renderHook(() => useCAS(engine));

    act(() => {
      result.current.setExpression('x**2 - 4');
      result.current.setVariable('x');
    });

    await act(async () => {
      await result.current.execute('solveEquation');
    });

    expect(result.current.status).toBe('success');
    expect(engine.solveEquation).toHaveBeenCalledWith('x**2 - 4', 'x');
  });

  it('sets error status when engine returns error', async () => {
    const engine = makeMockEngine();
    (engine.simplify as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'error',
      code: 'BACKEND_ERROR',
      message: 'parse error',
      originalExpression: 'bad',
    });

    const { result } = renderHook(() => useCAS(engine));
    act(() => result.current.setExpression('bad'));

    await act(async () => {
      await result.current.execute('simplify');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorMsg).toBe('parse error');
  });

  it('sets error status when engine throws', async () => {
    const engine = makeMockEngine();
    (engine.simplify as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useCAS(engine));
    act(() => result.current.setExpression('x'));

    await act(async () => {
      await result.current.execute('simplify');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorMsg).toBe('network down');
  });
});
