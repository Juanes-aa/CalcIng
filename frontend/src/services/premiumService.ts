const API_URL: string = import.meta.env.VITE_API_URL ?? '';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('calcing_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Graph3DResult {
  image_base64: string;
  format: string;
}

export interface ExportResult {
  content: string;
  format: string;
  content_type: string;
}

export interface PremiumError {
  upgrade_url?: string;
  message: string;
}

// ─── API calls ─────────────────────────────────────────────────────────────────

export async function renderGraph3D(
  expression: string,
  xRange: [number, number] = [-5, 5],
  yRange: [number, number] = [-5, 5],
  resolution: number = 50,
): Promise<Graph3DResult> {
  const res = await fetch(`${API_URL}/graph/3d`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      expression,
      x_range: xRange,
      y_range: yRange,
      resolution,
    }),
  });
  if (res.status === 402) {
    const err: PremiumError = await res.json().catch(() => ({ message: 'Plan premium requerido' }));
    throw new Error(err.message || 'UPGRADE_REQUIRED');
  }
  if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);
  return res.json();
}

export async function exportExpression(
  expression: string,
  format: 'latex' | 'png' = 'latex',
): Promise<ExportResult> {
  const res = await fetch(`${API_URL}/export`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ expression, format }),
  });
  if (res.status === 402) {
    const err: PremiumError = await res.json().catch(() => ({ message: 'Plan premium requerido' }));
    throw new Error(err.message || 'UPGRADE_REQUIRED');
  }
  if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);
  return res.json();
}
