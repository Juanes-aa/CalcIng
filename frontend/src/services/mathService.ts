export interface MathServiceResult {
  result: string;
  steps: string[];
  error?: string;
}

const BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8001';

export function isBackendEnabled(): boolean {
  return import.meta.env.VITE_USE_BACKEND === 'true';
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('calcing_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function postJSON(
  path: string,
  body: Record<string, unknown>,
): Promise<MathServiceResult> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    let detail = 'Server error';
    try {
      const text = await response.text();
      if (text) detail = text;
    } catch { /* ignore */ }
    return { result: '', steps: [], error: detail };
  }
  const data: Record<string, unknown> = await response.json();
  return {
    result: String(data.result ?? data.solutions ?? ''),
    steps: (Array.isArray(data.steps) ? data.steps : []) as string[],
  };
}

export async function solveExpression(
  expression: string,
): Promise<MathServiceResult> {
  try {
    return await postJSON('/solve', { expression });
  } catch {
    return { result: '', steps: [], error: 'Network error' };
  }
}

export async function differentiateExpression(
  expression: string,
  variable: string,
  order: number = 1,
): Promise<MathServiceResult> {
  try {
    return await postJSON('/differentiate', { expression, variable, order });
  } catch {
    return { result: '', steps: [], error: 'Network error' };
  }
}

export async function integrateExpression(
  expression: string,
  variable: string,
): Promise<MathServiceResult> {
  try {
    return await postJSON('/integrate', { expression, variable });
  } catch {
    return { result: '', steps: [], error: 'Network error' };
  }
}

export async function solveEquationExpression(
  equation: string,
  variable: string,
): Promise<MathServiceResult> {
  try {
    return await postJSON('/solve-equation', { equation, variable });
  } catch {
    return { result: '', steps: [], error: 'Network error' };
  }
}

export async function simplifyExpression(
  expression: string,
): Promise<MathServiceResult> {
  try {
    return await postJSON('/simplify', { expression });
  } catch {
    return { result: '', steps: [], error: 'Network error' };
  }
}

export async function expandExpression(
  expression: string,
): Promise<MathServiceResult> {
  try {
    return await postJSON('/expand', { expression });
  } catch {
    return { result: '', steps: [], error: 'Network error' };
  }
}

export async function factorExpression(
  expression: string,
): Promise<MathServiceResult> {
  try {
    return await postJSON('/factor', { expression });
  } catch {
    return { result: '', steps: [], error: 'Network error' };
  }
}