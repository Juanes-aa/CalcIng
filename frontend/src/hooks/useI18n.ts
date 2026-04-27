import { useCallback } from 'react';
import { t as translate, type TranslationKey } from '@engine/i18n';
import type { Locale } from '@engine/ajustes';
import { useSettings } from './useSettings';

export interface I18nApi {
  locale: Locale;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

function normalizeLocale(value: string): Locale {
  return value === 'en' ? 'en' : 'es';
}

export function useI18n(): I18nApi {
  const settings = useSettings();
  const locale = normalizeLocale(settings.language);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(key, locale, params),
    [locale],
  );

  return { locale, t };
}
