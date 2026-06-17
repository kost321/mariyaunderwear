import type { Metadata } from 'next'
import { CartProvider } from '@/hooks/useCart'
import { Header } from '@/components/shop/Header'
import './globals.css'

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// Базовые SEO-метаданные для всего сайта (SEO-friendly требование ТЗ).
export const metadata: Metadata = {
  metadataBase: new URL(serverUrl),
  title: {
    default: 'OLGA — магазин одежды',
    template: '%s — OLGA',
  },
  description: 'Интернет-магазин женской одежды OLGA. Платья, куртки, аксессуары.',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'OLGA',
  },
}

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-background">
        <CartProvider>
          <Header />
          <main className="container py-8">{children}</main>
          <footer className="border-t py-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} OLGA. Все права защищены.
          </footer>
        </CartProvider>
      </body>
    </html>
  )
}
