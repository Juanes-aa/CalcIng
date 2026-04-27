import { useEffect, useState } from 'react';
import { loadSettings, subscribeSettings, type AppSettings } from '@engine/ajustes';

/**
 * Retorna los ajustes actuales y se actualiza cada vez que
 * `saveSettings` los persiste desde cualquier parte de la app.
 */
export function useSettings(): AppSettings {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    const unsub = subscribeSettings(setSettings);
    return unsub;
  }, []);

  return settings;
}
