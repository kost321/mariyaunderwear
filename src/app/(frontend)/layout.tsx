import type { Metadata } from 'next'
import { Bitter, Great_Vibes, Inter } from 'next/font/google'
import { CartProvider } from '@/hooks/useCart'
import { Header } from '@/components/shop/Header'
import { Footer } from '@/components/shop/Footer'
import { getCategories } from '@/lib/queries'
import './globals.css'

// Шрифти макета (Aleo, Almarai, Alex Brush) не мають кирилиці — беремо найближчі з нею.
const sans = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' })
const serif = Bitter({ subsets: ['latin', 'cyrillic'], variable: '--font-serif' })
const script = Great_Vibes({ subsets: ['latin', 'cyrillic'], weight: '400', variable: '--font-script' })

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// Базовые SEO-метаданные для всего сайта (SEO-friendly требование ТЗ).
export const metadata: Metadata = {
  metadataBase: new URL(serverUrl),
  title: {
    default: 'Mariya Underwear — магазин одягу',
    template: '%s — Mariya Underwear',
  },
  description: 'Інтернет-магазин жіночого одягу Mariya Underwear. Нічні сорочки, піжами, халати, комплекти.',
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    siteName: 'Mariya Underwear',
  },
}

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Категорії для бокового меню; якщо БД недоступна — меню без них, сайт не падає
  const categories = (await getCategories().catch(() => [])).flatMap((c) =>
    c.slug ? [{ slug: c.slug, title: c.title }] : [],
  )

  return (
    <html lang="uk" className={`${sans.variable} ${serif.variable} ${script.variable}`}>
      <body className="flex min-h-screen flex-col bg-background font-sans">
        <CartProvider>
          <Header categories={categories} />
          <main className="container flex-1 py-8">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
