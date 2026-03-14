import nerdamer from 'nerdamer/all';
import type { CASEngine, CASResult } from './casEngine';

// ─── Helper ──────────────────────────────────────────────────────────────────

function makeError(originalExpression: string, message: string): CASResult {
  return {
    status: 'error',
    code: 'PARSE_ERROR',
    message,
    originalExpression,
  };
}

// ─── Implementación ──────────────────────────────────────────────────────────

export const nerdamerAdapter: CASEngine = {

  /**
   * Simplifica algebraicamente una expresión usando nerdamer.
   */
  async simplify(expr: string): Promise<CASResult> {
    try {
      const result = nerdamer.simplify(expr).toString();
      return { status: 'success', result };
    } catch (err) {
      return makeError(expr, err instanceof Error ? err.message : String(err));
    }
  },

  /**
   * Calcula la derivada de orden `order` respecto a `variable`.
   */
  async differentiate(expr: string, variable: string, order = 1): Promise<CASResult> {
    try {
      let result = expr;
      for (let i = 0; i < order; i++) {
        result = nerdamer.diff(result, variable).toString();
      }
      return { status: 'success', result };
    } catch (err) {
      return makeError(expr, err instanceof Error ? err.message : String(err));
    }
  },

  /**
   * Calcula la integral indefinida respecto a `variable`.
   */
  async integrate(expr: string, variable: string): Promise<CASResult> {
    try {
      const result = nerdamer.integrate(expr, variable).toString();
      return { status: 'success', result };
    } catch (err) {
      return makeError(expr, err instanceof Error ? err.message : String(err));
    }
  },

  /**
   * Resuelve una ecuación para `variable`.
   * Acepta forma "f(x) = 0" o "f(x) = g(x)"; nerdamer.solve() maneja ambas.
   */
  async solveEquation(equation: string, variable: string): Promise<CASResult> {
    try {
      const solutions = nerdamer.solve(equation, variable).toString();
      return { status: 'success', result: solutions };
    } catch (err) {
      return makeError(equation, err instanceof Error ? err.message : String(err));
    }
  },

  /**
   * Expande una expresión algebraica.
   */
  async expand(expr: string): Promise<CASResult> {
    try {
      const result = nerdamer.expand(expr).toString();
      return { status: 'success', result };
    } catch (err) {
      return makeError(expr, err instanceof Error ? err.message : String(err));
    }
  },

  /**
   * Factoriza una expresión algebraica.
   */
  async factor(expr: string): Promise<CASResult> {
    try {
      const result = nerdamer.factor(expr).toString();
      return { status: 'success', result };
    } catch (err) {
      return makeError(expr, err instanceof Error ? err.message : String(err));
    }
  },
};