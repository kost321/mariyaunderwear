import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CartProvider } from '@/hooks/useCart'
import { Header } from '@/components/shop/Header'
import { routing, ogLocales } from '@/i18n/routing'
import { alternates } from '@/lib/seo'
import '../globals.css'

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

// Кожна мова — окрема статична гілка.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// Базовые SEO-метаданные для всего сайта (SEO-friendly требование ТЗ).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const t = await getTranslations({ locale, namespace: 'Meta' })

  return {
    metadataBase: new URL(serverUrl),
    title: {
      default: t('siteTitle'),
      template: '%s — Mariya Underwear',
    },
    description: t('siteDescription'),
    alternates: alternates(locale, ''),
    openGraph: {
      type: 'website',
      locale: ogLocales[locale],
      siteName: 'Mariya Underwear',
    },
  }
}

export default async function FrontendLayout({ children, params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  // Дозволяє статичний рендер сторінок з next-intl.
  setRequestLocale(locale)
  const t = await getTranslations('Footer')

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-background">
        <NextIntlClientProvider>
          <CartProvider>
            <Header />
            <main className="container py-8">{children}</main>
            <footer className="border-t py-8 text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Mariya Underwear. {t('rights')}
            </footer>
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
