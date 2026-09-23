'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { routing, localeLabels } from '@/i18n/routing'
import { cn } from '@/lib/utils'

/**
 * Перемикач мови UA | PL | EN у шапці. Веде на ту саму сторінку іншою
 * мовою (slug товару спільний для всіх мов), зберігає ?category=… і
 * запам'ятовує вибір у cookie NEXT_LOCALE (це робить Link з `locale`).
 */
export function LanguageSwitcher() {
  // useSearchParams на статичних сторінках вимагає Suspense; поки query
  // не прочитано — ті самі посилання, лише без query.
  return (
    <Suspense fallback={<LocaleLinks />}>
      <LocaleLinksWithQuery />
    </Suspense>
  )
}

function LocaleLinksWithQuery() {
  const searchParams = useSearchParams()
  return <LocaleLinks query={Object.fromEntries(searchParams.entries())} />
}

function LocaleLinks({ query }: { query?: Record<string, string> }) {
  const t = useTranslations('Header')
  const locale = useLocale()
  const pathname = usePathname()

  return (
    <div role="group" aria-label={t('language')} className="flex items-center gap-1 text-xs">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={{ pathname, query }}
          locale={l}
          hrefLang={l}
          aria-current={l === locale ? 'true' : undefined}
          className={cn(
            'rounded px-1.5 py-1 transition-colors',
            l === locale
              ? 'font-semibold text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {localeLabels[l]}
        </Link>
      ))}
    </div>
  )
}
