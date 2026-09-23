import type { Metadata } from 'next'
import { routing, type Locale } from '@/i18n/routing'

/**
 * canonical + hreflang для сторінки, яка існує на всіх мовах.
 * `path` — шлях без мовного префікса: '' (головна), '/catalog',
 * '/product/slug'. Відносні URL резолвляться через metadataBase.
 */
export function alternates(locale: Locale, path: string): Metadata['alternates'] {
  const languages: Record<string, string> = {}
  for (const l of routing.locales) languages[l] = `/${l}${path}`
  languages['x-default'] = `/${routing.defaultLocale}${path}`

  return {
    canonical: `/${locale}${path}`,
    languages,
  }
}
