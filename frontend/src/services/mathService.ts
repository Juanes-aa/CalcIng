export interface MathServiceResult {
  result: string;
  steps: string[];
  error?: string;
}

const BASE_URL = 'http://localhost:8001';

export function isBackendEnabled(): boolean {
  return import.meta.env.VITE_USE_BACKEND === 'true';
}

export async function solveExpression(
  expression: string
): Promise<MathServiceResult> {
  try {
    const response = await fetch(`${BASE_URL}/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression }),
    });
    if (!response.ok) return { result: '', steps: [], error: 'Server error' };
    const data = await response.json();
    return { result: data.result, steps: data.steps ?? [] };
  } catch {
    return { result: '', steps: [], error: 'Network error' };
  }
}

export async function differentiateExpression(
  expression: string,
  variable: string
): Promise<MathServiceResult> {
  try {
    const response = await fetch(`${BASE_URL}/differentiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression, variable, order: 1 }),
    });
    if (!response.ok) return { result: '', steps: [], error: 'Server error' };
    const data = await response.json();
    return { result: data.result, steps: data.steps ?? [] };
  } catch {
    return { result: '', steps: [], error: 'Network error' };
  }
}

export async function integrateExpression(
  expression: string,
  variable: string
): Promise<MathServiceResult> {
  try {
    const response = await fetch(`${BASE_URL}/integrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression, variable }),
    });
    if (!response.ok) return { result: '', steps: [], error: 'Server error' };
    const data = await response.json();
    return { result: data.result, steps: data.steps ?? [] };
  } catch {
    return { result: '', steps: [], error: 'Network error' };
  }
}