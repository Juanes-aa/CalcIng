import type { CASEngine, CASResult } from './casEngine';
import {
  simplifyExpression,
  differentiateExpression,
  integrateExpression,
  solveEquationExpression,
  expandExpression,
  factorExpression,
} from '../../services/mathService';
import type { MathServiceResult } from '../../services/mathService';

function toResult(res: MathServiceResult): CASResult {
  if (res.error) {
    return {
      status: 'error',
      code: 'BACKEND_ERROR',
      message: res.error,
      originalExpression: '',
    };
  }
  return { status: 'success', result: res.result };
}

export const sympyAdapter: CASEngine = {
  async simplify(expr: string): Promise<CASResult> {
    try {
      const res = await simplifyExpression(expr);
      return toResult(res);
    } catch (err) {
      return {
        status: 'error',
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : String(err),
        originalExpression: expr,
      };
    }
  },

  async differentiate(expr: string, variable: string, order = 1): Promise<CASResult> {
    try {
      const res = await differentiateExpression(expr, variable, order);
      return toResult(res);
    } catch (err) {
      return {
        status: 'error',
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : String(err),
        originalExpression: expr,
      };
    }
  },

  async integrate(expr: string, variable: string): Promise<CASResult> {
    try {
      const res = await integrateExpression(expr, variable);
      return toResult(res);
    } catch (err) {
      return {
        status: 'error',
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : String(err),
        originalExpression: expr,
      };
    }
  },

  async solveEquation(equation: string, variable: string): Promise<CASResult> {
    try {
      const res = await solveEquationExpression(equation, variable);
      return toResult(res);
    } catch (err) {
      return {
        status: 'error',
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : String(err),
        originalExpression: equation,
      };
    }
  },

  async expand(expr: string): Promise<CASResult> {
    try {
      const res = await expandExpression(expr);
      return toResult(res);
    } catch (err) {
      return {
        status: 'error',
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : String(err),
        originalExpression: expr,
      };
    }
  },

  async factor(expr: string): Promise<CASResult> {
    try {
      const res = await factorExpression(expr);
      return toResult(res);
    } catch (err) {
      return {
        status: 'error',
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : String(err),
        originalExpression: expr,
      };
    }
  },
};
