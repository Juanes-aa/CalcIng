/**
 * ajustes.ts
 * Modelo y persistencia de la configuración de la aplicación.
 */

export type Locale = 'es' | 'en';

export interface AppSettings {
  precision:     number;   // dígitos de precisión decimal (2-15)
  sciNotation:   boolean;  // auto-formato científico para n > 10^9
  theme:         'dark' | 'light';
  language:      Locale;
}

const STORAGE_KEY   = 'calcIng_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  precision:   12,
  sciNotation: true,
  theme:       'dark',
  language:    'es',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

// ─── Bus de eventos para cambios en runtime ───────────────────────────────────

type SettingsListener = (s: AppSettings) => void;
const _listeners: Set<SettingsListener> = new Set();

export function subscribeSettings(listener: SettingsListener): () => void {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

export function saveSettings(s: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  _listeners.forEach(fn => { try { fn(s); } catch { /* noop */ } });
}

export function applyTheme(theme: AppSettings['theme']): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('light', theme === 'light');
}
