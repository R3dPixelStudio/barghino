export const locales = ['fa', 'en'] as const;
export type Locale = (typeof locales)[number];
export type Direction = 'rtl' | 'ltr';

export function resolveLocale(segments?: string[]): Locale | null {
  if (!segments?.length) return 'fa';
  if (segments.length !== 1) return null;
  return locales.includes(segments[0] as Locale) ? (segments[0] as Locale) : null;
}

export function compositionFor(locale: Locale) {
  const side = locale === 'fa' ? -1 : 1;
  return {
    direction: (locale === 'fa' ? 'rtl' : 'ltr') as Direction,
    side,
    cameraX: side * 0.65,
    assetX: side * 0.12,
    assetYaw: side * 0.16,
  };
}
