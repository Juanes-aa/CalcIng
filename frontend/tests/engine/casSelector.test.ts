import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock adapters before importing casSelector
vi.mock('../../src/engine/cas/nerdamerAdapter', () => ({
  nerdamerAdapter: { _id: 'nerdamer' },
}));

vi.mock('../../src/engine/cas/sympyAdapter', () => ({
  sympyAdapter: { _id: 'sympy' },
}));

import { getActiveCASEngine } from '../../src/engine/cas/casSelector';

const originalEnv = { ...import.meta.env };

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  // Restore env
  Object.assign(import.meta.env, originalEnv);
});

describe('getActiveCASEngine', () => {
  it('returns nerdamerAdapter when VITE_USE_BACKEND is not set', () => {
    import.meta.env.VITE_USE_BACKEND = '';
    const engine = getActiveCASEngine();
    expect((engine as unknown as Record<string, string>)._id).toBe('nerdamer');
  });

  it('returns nerdamerAdapter when VITE_USE_BACKEND is false', () => {
    import.meta.env.VITE_USE_BACKEND = 'false';
    const engine = getActiveCASEngine();
    expect((engine as unknown as Record<string, string>)._id).toBe('nerdamer');
  });

  it('returns nerdamerAdapter when VITE_USE_BACKEND is true but no token', () => {
    import.meta.env.VITE_USE_BACKEND = 'true';
    localStorage.removeItem('calcing_token');
    const engine = getActiveCASEngine();
    expect((engine as unknown as Record<string, string>)._id).toBe('nerdamer');
  });

  it('returns sympyAdapter when VITE_USE_BACKEND is true and token exists', () => {
    import.meta.env.VITE_USE_BACKEND = 'true';
    localStorage.setItem('calcing_token', 'fake-jwt-token');
    const engine = getActiveCASEngine();
    expect((engine as unknown as Record<string, string>)._id).toBe('sympy');
  });

  it('returns nerdamerAdapter after token is removed', () => {
    import.meta.env.VITE_USE_BACKEND = 'true';
    localStorage.setItem('calcing_token', 'fake-jwt-token');
    let engine = getActiveCASEngine();
    expect((engine as unknown as Record<string, string>)._id).toBe('sympy');

    localStorage.removeItem('calcing_token');
    engine = getActiveCASEngine();
    expect((engine as unknown as Record<string, string>)._id).toBe('nerdamer');
  });
});
