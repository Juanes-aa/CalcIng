import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CASResult } from './casEngine';

// ─── Mock de mathService (fetch no se ejecuta) ────────────────────────────────

const mockSimplify  = vi.fn();
const mockDiff      = vi.fn();
const mockIntegrate = vi.fn();
const mockSolveEq   = vi.fn();
const mockExpand    = vi.fn();
const mockFactor    = vi.fn();

vi.mock('../../services/mathService', () => ({
  simplifyExpression:      (...args: unknown[]) => mockSimplify(...args),
  differentiateExpression: (...args: unknown[]) => mockDiff(...args),
  integrateExpression:     (...args: unknown[]) => mockIntegrate(...args),
  solveEquationExpression: (...args: unknown[]) => mockSolveEq(...args),
  expandExpression:        (...args: unknown[]) => mockExpand(...args),
  factorExpression:        (...args: unknown[]) => mockFactor(...args),
}));

// Importar después del mock
import { sympyAdapter } from './sympyAdapter';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function okResult(result: string) {
  return { result, steps: ['paso 1'] };
}

function errResult(error: string) {
  return { result: '', steps: [], error };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sympyAdapter', () => {

  // --- simplify ---

  it('simplify: retorna CASSuccess cuando el backend responde OK', async () => {
    mockSimplify.mockResolvedValue(okResult('2*x'));
    const r: CASResult = await sympyAdapter.simplify('x + x');
    expect(r.status).toBe('success');
    if (r.status === 'success') expect(r.result).toBe('2*x');
    expect(mockSimplify).toHaveBeenCalledWith('x + x');
  });

  it('simplify: retorna CASError cuando el backend retorna error', async () => {
    mockSimplify.mockResolvedValue(errResult('invalid'));
    const r = await sympyAdapter.simplify('???');
    expect(r.status).toBe('error');
    if (r.status === 'error') {
      expect(r.code).toBe('BACKEND_ERROR');
      expect(r.message).toBe('invalid');
    }
  });

  it('simplify: retorna NETWORK_ERROR si fetch falla', async () => {
    mockSimplify.mockRejectedValue(new Error('fetch failed'));
    const r = await sympyAdapter.simplify('x');
    expect(r.status).toBe('error');
    if (r.status === 'error') {
      expect(r.code).toBe('NETWORK_ERROR');
      expect(r.message).toBe('fetch failed');
      expect(r.originalExpression).toBe('x');
    }
  });

  // --- differentiate ---

  it('differentiate: pasa expression, variable, order al backend', async () => {
    mockDiff.mockResolvedValue(okResult('6*x'));
    const r = await sympyAdapter.differentiate('x**3', 'x', 2);
    expect(r.status).toBe('success');
    if (r.status === 'success') expect(r.result).toBe('6*x');
    expect(mockDiff).toHaveBeenCalledWith('x**3', 'x', 2);
  });

  it('differentiate: order default = 1', async () => {
    mockDiff.mockResolvedValue(okResult('2*x'));
    await sympyAdapter.differentiate('x**2', 'x');
    expect(mockDiff).toHaveBeenCalledWith('x**2', 'x', 1);
  });

  it('differentiate: NETWORK_ERROR en excepción', async () => {
    mockDiff.mockRejectedValue(new TypeError('Network error'));
    const r = await sympyAdapter.differentiate('x', 'x');
    expect(r.status).toBe('error');
    if (r.status === 'error') expect(r.code).toBe('NETWORK_ERROR');
  });

  // --- integrate ---

  it('integrate: retorna resultado correcto', async () => {
    mockIntegrate.mockResolvedValue(okResult('x**3/3'));
    const r = await sympyAdapter.integrate('x**2', 'x');
    expect(r.status).toBe('success');
    if (r.status === 'success') expect(r.result).toBe('x**3/3');
    expect(mockIntegrate).toHaveBeenCalledWith('x**2', 'x');
  });

  // --- solveEquation ---

  it('solveEquation: retorna soluciones como string', async () => {
    mockSolveEq.mockResolvedValue(okResult('[-2, 2]'));
    const r = await sympyAdapter.solveEquation('x**2 - 4', 'x');
    expect(r.status).toBe('success');
    if (r.status === 'success') expect(r.result).toBe('[-2, 2]');
    expect(mockSolveEq).toHaveBeenCalledWith('x**2 - 4', 'x');
  });

  // --- expand ---

  it('expand: retorna expresión expandida', async () => {
    mockExpand.mockResolvedValue(okResult('x**2 + 2*x + 1'));
    const r = await sympyAdapter.expand('(x+1)**2');
    expect(r.status).toBe('success');
    if (r.status === 'success') expect(r.result).toBe('x**2 + 2*x + 1');
  });

  // --- factor ---

  it('factor: retorna expresión factorizada', async () => {
    mockFactor.mockResolvedValue(okResult('(x - 2)*(x - 3)'));
    const r = await sympyAdapter.factor('x**2 - 5*x + 6');
    expect(r.status).toBe('success');
    if (r.status === 'success') expect(r.result).toBe('(x - 2)*(x - 3)');
  });

  it('factor: BACKEND_ERROR con detalle', async () => {
    mockFactor.mockResolvedValue(errResult('timeout'));
    const r = await sympyAdapter.factor('huge_expr');
    expect(r.status).toBe('error');
    if (r.status === 'error') expect(r.message).toBe('timeout');
  });

  // --- Errores no-Error ---

  it('maneja throw de valor no-Error (string)', async () => {
    mockSimplify.mockRejectedValue('raw string error');
    const r = await sympyAdapter.simplify('x');
    expect(r.status).toBe('error');
    if (r.status === 'error') expect(r.message).toBe('raw string error');
  });
});
