import type { Metadata } from 'next'
import { Cormorant_Garamond, Manrope } from 'next/font/google'
import { CartProvider } from '@/hooks/useCart'
import { Header } from '@/components/shop/Header'
import './globals.css'

// Шрифти бренду: Manrope — інтерфейсний текст (лейбли, меню, кнопки),
// Cormorant Garamond — великі заголовки (hero, назви секцій).
const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-manrope',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500'],
  variable: '--font-cormorant',
})

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

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk" className={`${manrope.variable} ${cormorant.variable}`}>
      <body className="min-h-screen bg-background font-sans">
        <CartProvider>
          <Header />
          <main>{children}</main>
          <footer className="border-t py-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Mariya Underwear. Всі права захищені.
          </footer>
        </CartProvider>
      </body>
    </html>
  )
}
