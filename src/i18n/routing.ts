import { defineRouting } from 'next-intl/routing'

/**
 * URL-префікс кожної мови. Українська — /ua (як звикли покупці), хоча
 * код мови лишається 'uk' (ISO 639-1): його бачать Google (hreflang),
 * <html lang>, Payload. 'ua' — код країни, не мови.
 */
const prefixes = { uk: '/ua', pl: '/pl', en: '/en' } as const

/**
 * Мови сайту. URL завжди з префіксом: /ua/…, /pl/…, /en/….
 * Вибір запам'ятовується в cookie NEXT_LOCALE (next-intl ставить його при
 * перемиканні мови), тож наступний захід на «/» веде на обрану мову.
 * Без cookie — мова браузера (Accept-Language), інакше uk.
 *
 * Список має збігатися з localization.locales у payload.config.ts.
 */
export const routing = defineRouting({
  locales: ['uk', 'pl', 'en'],
  defaultLocale: 'uk',
  localePrefix: { mode: 'always', prefixes },
  // За замовчуванням cookie сесійна — зберігаємо вибір на рік.
  localeCookie: { maxAge: 60 * 60 * 24 * 365 },
})

export type Locale = (typeof routing.locales)[number]

/** Префікс адреси мови: localePath('uk') → '/ua'. */
export function localePath(locale: Locale): string {
  return prefixes[locale]
}

/** Підпис мови на кнопці перемикача: UA · PL · EN. */
export const localeLabels: Record<Locale, string> = {
  uk: 'UA',
  pl: 'PL',
  en: 'EN',
}

/** og:locale для кожної мови. */
export const ogLocales: Record<Locale, string> = {
  uk: 'uk_UA',
  pl: 'pl_PL',
  en: 'en_US',
}
