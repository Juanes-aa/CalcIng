import type { CASEngine } from './casEngine';
import { nerdamerAdapter } from './nerdamerAdapter';
import { sympyAdapter } from './sympyAdapter';

/**
 * Selecciona el motor CAS activo:
 * - Si VITE_USE_BACKEND === 'true' y hay JWT en localStorage → sympyAdapter (backend SymPy)
 * - Si no → nerdamerAdapter (client-side, offline)
 */
export function getActiveCASEngine(): CASEngine {
  const useBackend = import.meta.env.VITE_USE_BACKEND === 'true';
  const hasToken = !!localStorage.getItem('calcing_token');
  if (useBackend && hasToken) return sympyAdapter;
  return nerdamerAdapter;
}
