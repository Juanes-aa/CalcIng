import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const MANIFEST_PATH = resolve(__dirname, '../../public/manifest.json');

describe('PWA Manifest', () => {
  it('el archivo manifest.json existe en public/', () => {
    expect(existsSync(MANIFEST_PATH)).toBe(true);
  });

  it('tiene los campos obligatorios de PWA', () => {
    const raw = readFileSync(MANIFEST_PATH, 'utf-8');
    const manifest = JSON.parse(raw);
    expect(manifest.name).toBe('CalcIng');
    expect(manifest.short_name).toBe('CalcIng');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#6666cc');
    expect(manifest.background_color).toBe('#0a0a14');
  });

  it('tiene al menos un ícono de 192x192', () => {
    const raw = readFileSync(MANIFEST_PATH, 'utf-8');
    const manifest = JSON.parse(raw);
    expect(Array.isArray(manifest.icons)).toBe(true);
    const icon192 = manifest.icons.find(
      (i: { sizes: string }) => i.sizes === '192x192'
    );
    expect(icon192).toBeDefined();
    expect(icon192.type).toBe('image/png');
  });

  it('tiene ícono de 512x512', () => {
    const raw = readFileSync(MANIFEST_PATH, 'utf-8');
    const manifest = JSON.parse(raw);
    const icon512 = manifest.icons.find(
      (i: { sizes: string }) => i.sizes === '512x512'
    );
    expect(icon512).toBeDefined();
    expect(icon512.type).toBe('image/png');
  });

  it('tiene campo maskable para Android', () => {
    const raw = readFileSync(MANIFEST_PATH, 'utf-8');
    const manifest = JSON.parse(raw);
    const maskable = manifest.icons.find(
      (i: { purpose?: string }) => i.purpose === 'maskable'
    );
    expect(maskable).toBeDefined();
  });
});