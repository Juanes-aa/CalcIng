import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { renderGraph3D, exportExpression } from './premiumService';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem('calcing_token', 'pro.jwt.token');
});

afterEach(() => {
  localStorage.clear();
});

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
}

describe('premiumService', () => {

  // ─── renderGraph3D ──────────────────────────────────────────────────

  it('renderGraph3D: retorna image_base64 con plan pro', async () => {
    mockFetch.mockReturnValue(jsonResponse({ image_base64: 'iVBOR...', format: 'png' }));
    const r = await renderGraph3D('x**2 + y**2');
    expect(r.image_base64).toBe('iVBOR...');
    expect(r.format).toBe('png');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/graph/3d'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('renderGraph3D: pasa rangos y resolución', async () => {
    mockFetch.mockReturnValue(jsonResponse({ image_base64: 'x', format: 'png' }));
    await renderGraph3D('x+y', [-2, 2], [-3, 3], 30);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.x_range).toEqual([-2, 2]);
    expect(body.y_range).toEqual([-3, 3]);
    expect(body.resolution).toBe(30);
  });

  it('renderGraph3D: lanza en 402 (upgrade required)', async () => {
    mockFetch.mockReturnValue(jsonResponse(
      { message: 'Plan premium requerido', upgrade_url: '/pricing' }, 402,
    ));
    await expect(renderGraph3D('x+y')).rejects.toThrow('Plan premium requerido');
  });

  it('renderGraph3D: lanza en error HTTP genérico', async () => {
    mockFetch.mockReturnValue(jsonResponse({}, 500));
    await expect(renderGraph3D('x+y')).rejects.toThrow('HTTP_ERROR_500');
  });

  // ─── exportExpression ───────────────────────────────────────────────

  it('exportExpression: retorna LaTeX', async () => {
    mockFetch.mockReturnValue(jsonResponse({
      content: 'x^{2} + 1', format: 'latex', content_type: 'text/x-latex',
    }));
    const r = await exportExpression('x**2 + 1', 'latex');
    expect(r.format).toBe('latex');
    expect(r.content).toContain('x');
  });

  it('exportExpression: retorna PNG base64', async () => {
    mockFetch.mockReturnValue(jsonResponse({
      content: 'iVBOR...', format: 'png', content_type: 'image/png;base64',
    }));
    const r = await exportExpression('x**2', 'png');
    expect(r.format).toBe('png');
  });

  it('exportExpression: lanza en 402', async () => {
    mockFetch.mockReturnValue(jsonResponse(
      { message: 'Plan premium requerido' }, 402,
    ));
    await expect(exportExpression('x', 'latex')).rejects.toThrow('Plan premium requerido');
  });

  // ─── Auth header ────────────────────────────────────────────────────

  it('envía Authorization header con token', async () => {
    mockFetch.mockReturnValue(jsonResponse({ content: 'x', format: 'latex', content_type: 'text/x-latex' }));
    await exportExpression('x', 'latex');
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer pro.jwt.token');
  });

  it('no envía Authorization sin token', async () => {
    localStorage.removeItem('calcing_token');
    mockFetch.mockReturnValue(jsonResponse({ content: 'x', format: 'latex', content_type: 'text/x-latex' }));
    await exportExpression('x', 'latex');
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBeUndefined();
  });
});
