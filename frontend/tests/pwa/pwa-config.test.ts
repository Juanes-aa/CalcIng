import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('PWA Vite Config', () => {
  it('vite-plugin-pwa está en las dependencias del proyecto', () => {
    const pkgPath = resolve(__dirname, '../../package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };
    expect(allDeps['vite-plugin-pwa']).toBeDefined();
  });

  it('vite.config.ts importa VitePWA', () => {
    const configPath = resolve(__dirname, '../../vite.config.ts');
    const content = readFileSync(configPath, 'utf-8');
    expect(content).toContain('vite-plugin-pwa');
    expect(content).toContain('VitePWA');
  });

  it('vite.config.ts tiene registerType autoUpdate', () => {
    const configPath = resolve(__dirname, '../../vite.config.ts');
    const content = readFileSync(configPath, 'utf-8');
    expect(content).toContain('autoUpdate');
  });

  it('vite.config.ts configura workbox con networkFirst para API', () => {
    const configPath = resolve(__dirname, '../../vite.config.ts');
    const content = readFileSync(configPath, 'utf-8');
    expect(content).toContain('NetworkFirst');
  });

  it('el link al manifest existe en index.html', () => {
    const indexPath = resolve(__dirname, '../../index.html');
    const content = readFileSync(indexPath, 'utf-8');
    expect(content).toContain('manifest.json');
  });
});