import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'

type Props = { params: Promise<{ locale: Locale }> }

// The tab title of the 404 page: for this catch-all route Next does not take it from not-found.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'NotFound' })
  return { title: t('title') }
}

/**
 * Any address inside a language that matches no page (/pl/whatever) → [locale]/not-found.tsx, shown with
 * the site header and footer. Addresses without a language prefix are redirected by the middleware first.
 */
export default function CatchAll() {
  notFound()
}
