import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MathServiceResult } from '../../src/services/mathService';

// Mock mathService before importing sympyAdapter
vi.mock('../../src/services/mathService', () => ({
  simplifyExpression: vi.fn(),
  differentiateExpression: vi.fn(),
  integrateExpression: vi.fn(),
  solveEquationExpression: vi.fn(),
  expandExpression: vi.fn(),
  factorExpression: vi.fn(),
}));

import { sympyAdapter } from '../../src/engine/cas/sympyAdapter';
import {
  simplifyExpression,
  differentiateExpression,
  integrateExpression,
  solveEquationExpression,
  expandExpression,
  factorExpression,
} from '../../src/services/mathService';

const mockSimplify = vi.mocked(simplifyExpression);
const mockDifferentiate = vi.mocked(differentiateExpression);
const mockIntegrate = vi.mocked(integrateExpression);
const mockSolveEquation = vi.mocked(solveEquationExpression);
const mockExpand = vi.mocked(expandExpression);
const mockFactor = vi.mocked(factorExpression);

function ok(result: string): MathServiceResult {
  return { result, steps: ['step1'] };
}

function err(error: string): MathServiceResult {
  return { result: '', steps: [], error };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// --- simplify ---

describe('sympyAdapter.simplify', () => {
  it('returns success on valid response', async () => {
    mockSimplify.mockResolvedValue(ok('2*x'));
    const r = await sympyAdapter.simplify('x + x');
    expect(r).toEqual({ status: 'success', result: '2*x' });
    expect(mockSimplify).toHaveBeenCalledWith('x + x');
  });

  it('returns error when backend fails', async () => {
    mockSimplify.mockResolvedValue(err('Server error'));
    const r = await sympyAdapter.simplify('bad');
    expect(r.status).toBe('error');
  });

  it('returns error on network throw', async () => {
    mockSimplify.mockRejectedValue(new Error('fetch failed'));
    const r = await sympyAdapter.simplify('x');
    expect(r.status).toBe('error');
    if (r.status === 'error') {
      expect(r.message).toBe('fetch failed');
    }
  });
});

// --- differentiate ---

describe('sympyAdapter.differentiate', () => {
  it('returns success', async () => {
    mockDifferentiate.mockResolvedValue(ok('2*x'));
    const r = await sympyAdapter.differentiate('x**2', 'x', 1);
    expect(r).toEqual({ status: 'success', result: '2*x' });
    expect(mockDifferentiate).toHaveBeenCalledWith('x**2', 'x', 1);
  });

  it('returns error on backend error', async () => {
    mockDifferentiate.mockResolvedValue(err('bad expr'));
    const r = await sympyAdapter.differentiate('???', 'x');
    expect(r.status).toBe('error');
  });
});

// --- integrate ---

describe('sympyAdapter.integrate', () => {
  it('returns success', async () => {
    mockIntegrate.mockResolvedValue(ok('x**3/3'));
    const r = await sympyAdapter.integrate('x**2', 'x');
    expect(r).toEqual({ status: 'success', result: 'x**3/3' });
  });

  it('returns error on throw', async () => {
    mockIntegrate.mockRejectedValue(new Error('timeout'));
    const r = await sympyAdapter.integrate('x', 'x');
    expect(r.status).toBe('error');
  });
});

// --- solveEquation ---

describe('sympyAdapter.solveEquation', () => {
  it('returns success', async () => {
    mockSolveEquation.mockResolvedValue(ok('[2, 3]'));
    const r = await sympyAdapter.solveEquation('x**2 - 5*x + 6', 'x');
    expect(r).toEqual({ status: 'success', result: '[2, 3]' });
  });

  it('returns error on backend error', async () => {
    mockSolveEquation.mockResolvedValue(err('parse error'));
    const r = await sympyAdapter.solveEquation('bad', 'x');
    expect(r.status).toBe('error');
  });
});

// --- expand ---

describe('sympyAdapter.expand', () => {
  it('returns success', async () => {
    mockExpand.mockResolvedValue(ok('x**2 + 2*x + 1'));
    const r = await sympyAdapter.expand('(x+1)**2');
    expect(r).toEqual({ status: 'success', result: 'x**2 + 2*x + 1' });
  });

  it('returns error on throw', async () => {
    mockExpand.mockRejectedValue(new Error('net'));
    const r = await sympyAdapter.expand('x');
    expect(r.status).toBe('error');
  });
});

// --- factor ---

describe('sympyAdapter.factor', () => {
  it('returns success', async () => {
    mockFactor.mockResolvedValue(ok('(x-2)*(x-3)'));
    const r = await sympyAdapter.factor('x**2 - 5*x + 6');
    expect(r).toEqual({ status: 'success', result: '(x-2)*(x-3)' });
  });

  it('returns error on backend error', async () => {
    mockFactor.mockResolvedValue(err('invalid'));
    const r = await sympyAdapter.factor('bad');
    expect(r.status).toBe('error');
  });

  it('returns error on network throw', async () => {
    mockFactor.mockRejectedValue(new Error('offline'));
    const r = await sympyAdapter.factor('x');
    expect(r.status).toBe('error');
    if (r.status === 'error') {
      expect(r.message).toBe('offline');
    }
  });
});
