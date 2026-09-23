import { defineRouting } from 'next-intl/routing'

/**
 * Мови сайту. URL завжди з префіксом: /uk/…, /pl/…, /en/….
 * Вибір запам'ятовується в cookie NEXT_LOCALE (next-intl ставить його при
 * перемиканні мови), тож наступний захід на «/» веде на обрану мову.
 * Без cookie — мова браузера (Accept-Language), інакше uk.
 *
 * Список має збігатися з localization.locales у payload.config.ts.
 */
export const routing = defineRouting({
  locales: ['uk', 'pl', 'en'],
  defaultLocale: 'uk',
  localePrefix: 'always',
  // За замовчуванням cookie сесійна — зберігаємо вибір на рік.
  localeCookie: { maxAge: 60 * 60 * 24 * 365 },
})

export type Locale = (typeof routing.locales)[number]

/** og:locale для кожної мови. */
export const ogLocales: Record<Locale, string> = {
  uk: 'uk_UA',
  pl: 'pl_PL',
  en: 'en_US',
}
