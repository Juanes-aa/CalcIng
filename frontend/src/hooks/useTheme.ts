import { useEffect, useState } from 'react';
import type { AppSettings } from '@engine/ajustes';

function currentTheme(): AppSettings['theme'] {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

/**
 * Observa la clase `light` en <html> y retorna el tema activo.
 * Permite que componentes con dibujo imperativo (canvas) reaccionen
 * al cambio de tema realizado desde AjustesView.
 */
export function useTheme(): AppSettings['theme'] {
  const [theme, setTheme] = useState<AppSettings['theme']>(currentTheme);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const observer = new MutationObserver(() => setTheme(currentTheme()));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
