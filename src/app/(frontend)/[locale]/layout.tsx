import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Aleo, Great_Vibes, Inter, Podkova } from 'next/font/google'
import { CartProvider } from '@/hooks/useCart'
import { Header } from '@/components/shop/Header'
import { Footer } from '@/components/shop/Footer'
import { getCategories } from '@/lib/queries'
import { routing, ogLocales } from '@/i18n/routing'
import { alternates } from '@/lib/seo'
import '../globals.css'

// Body text: the design font (Almarai) has no Cyrillic, so Inter is used. Script: Great Vibes instead of Alex Brush.
const sans = Inter({ subsets: ['latin', 'latin-ext', 'cyrillic'], variable: '--font-sans' })
const script = Great_Vibes({ subsets: ['latin', 'latin-ext', 'cyrillic'], weight: '400', variable: '--font-script' })
// Serif text (headings, product names, prices) per the design "Typograpy" page: Podkova for Ukrainian,
// Aleo for English. `font-serif` picks one by <html lang> (globals.css). Aleo has no Cyrillic and is not
// preloaded, so Ukrainian pages never download it.
const serifUk = Podkova({ subsets: ['latin', 'latin-ext', 'cyrillic'], variable: '--font-serif-uk' })
const serifEn = Aleo({ subsets: ['latin'], variable: '--font-serif-en', preload: false })

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

  // Categories for the side menu; if the DB is unavailable the menu renders without them and the site does not crash
  const categories = (await getCategories(locale).catch(() => [])).flatMap((c) =>
    c.slug ? [{ slug: c.slug, title: c.title ?? '' }] : [],
  )

  return (
    <html lang={locale} className={`${sans.variable} ${script.variable} ${serifUk.variable} ${serifEn.variable}`}>
      <body className="flex min-h-screen flex-col bg-background font-sans">
        <NextIntlClientProvider>
          <CartProvider>
            <Header categories={categories} />
            <main className="container flex-1 py-8">{children}</main>
            <Footer />
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
