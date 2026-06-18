import type { Metadata } from 'next'
import { CartProvider } from '@/hooks/useCart'
import { Header } from '@/components/shop/Header'
import './globals.css'

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// Базовые SEO-метаданные для всего сайта (SEO-friendly требование ТЗ).
export const metadata: Metadata = {
  metadataBase: new URL(serverUrl),
  title: {
    default: 'OLGA — магазин одягу',
    template: '%s — OLGA',
  },
  description: 'Інтернет-магазин жіночого одягу OLGA. Нічні сорочки, піжами, халати, комплекти.',
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    siteName: 'OLGA',
  },
}

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <body className="min-h-screen bg-background">
        <CartProvider>
          <Header />
          <main className="container py-8">{children}</main>
          <footer className="border-t py-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} OLGA. Всі права захищені.
          </footer>
        </CartProvider>
      </body>
    </html>
  )
}
