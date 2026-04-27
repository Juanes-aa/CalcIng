import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mocks de los adapters ───────────────────────────────────────────────────
// vi.hoisted() asegura que las constantes existan antes de los vi.mock hoisted.

const { mockNerdamer, mockSympy } = vi.hoisted(() => ({
  mockNerdamer: { id: 'nerdamer' },
  mockSympy:    { id: 'sympy' },
}));

vi.mock('./nerdamerAdapter', () => ({ nerdamerAdapter: mockNerdamer }));
vi.mock('./sympyAdapter',    () => ({ sympyAdapter: mockSympy }));

import { getActiveCASEngine } from './casSelector';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('casSelector — getActiveCASEngine', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    // Restaurar env original
    Object.assign(import.meta.env, originalEnv);
  });

  it('retorna nerdamerAdapter cuando VITE_USE_BACKEND es falsy', () => {
    import.meta.env.VITE_USE_BACKEND = 'false';
    localStorage.setItem('calcing_token', 'jwt.token.here');
    const engine = getActiveCASEngine();
    expect(engine).toBe(mockNerdamer);
  });

  it('retorna nerdamerAdapter cuando VITE_USE_BACKEND es undefined', () => {
    import.meta.env.VITE_USE_BACKEND = undefined as unknown as string;
    localStorage.setItem('calcing_token', 'jwt.token.here');
    const engine = getActiveCASEngine();
    expect(engine).toBe(mockNerdamer);
  });

  it('retorna nerdamerAdapter cuando VITE_USE_BACKEND=true pero no hay JWT', () => {
    import.meta.env.VITE_USE_BACKEND = 'true';
    // Sin token en localStorage
    const engine = getActiveCASEngine();
    expect(engine).toBe(mockNerdamer);
  });

  it('retorna sympyAdapter cuando VITE_USE_BACKEND=true Y hay JWT', () => {
    import.meta.env.VITE_USE_BACKEND = 'true';
    localStorage.setItem('calcing_token', 'jwt.token.here');
    const engine = getActiveCASEngine();
    expect(engine).toBe(mockSympy);
  });

  it('retorna nerdamerAdapter si el token se borra (logout)', () => {
    import.meta.env.VITE_USE_BACKEND = 'true';
    localStorage.setItem('calcing_token', 'jwt.token.here');
    expect(getActiveCASEngine()).toBe(mockSympy);

    localStorage.removeItem('calcing_token');
    expect(getActiveCASEngine()).toBe(mockNerdamer);
  });
});
