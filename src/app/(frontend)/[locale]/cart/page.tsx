import type { Metadata } from 'next'
import type { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CartPage } from '@/components/shop/CartPage'
import { alternates } from '@/lib/seo'

type Props = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Meta' })
  return {
    title: t('cartTitle'),
    alternates: alternates(locale, '/cart'),
    // Кошик — персональна сторінка, в пошуку їй нічого робити.
    robots: { index: false },
  }
}

export default async function Cart({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return <CartPage />
}
