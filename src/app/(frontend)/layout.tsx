import type { Metadata } from 'next'
import { Inter, Podkova } from 'next/font/google'
import { CartProvider } from '@/hooks/useCart'
import { Header } from '@/components/shop/Header'
import { Footer } from '@/components/shop/Footer'
import { getNonEmptyCategories } from '@/lib/queries'
import './globals.css'

// Two typefaces: Inter for text (the design's Almarai has no Cyrillic) and Podkova for headings,
// product names and prices (`font-serif`). The script font stays only in the logo image; the
// English serif (Aleo) was never used, the site is Ukrainian only.
const sans = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' })
const serif = Podkova({ subsets: ['latin', 'cyrillic'], variable: '--font-serif' })

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// Base SEO metadata for the whole site (SEO-friendly requirement from the spec).
export const metadata: Metadata = {
  metadataBase: new URL(serverUrl),
  title: {
    default: 'Нічні сорочки та домашній одяг із шовку Армані — Mariya Underwear',
    template: '%s — Mariya Underwear',
  },
  description:
    'Інтернет-магазин Mariya Underwear: жіночі нічні сорочки, піжами, халати та комплекти. Виготовлено в Україні, доставка Новою поштою.',
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    siteName: 'Mariya Underwear',
    // Link preview (Telegram, Viber, Instagram). Icons come from icon.png / apple-icon.png / app/favicon.ico.
    images: [{ url: '/brand/og-image.png', width: 1200, height: 630, alt: 'Mariya Underwear' }],
  },
}

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Categories with products for the side menu; if the DB is unavailable the menu renders without them and the site does not crash
  const categories = (await getNonEmptyCategories().catch(() => [])).flatMap((c) =>
    c.slug ? [{ slug: c.slug, title: c.title }] : [],
  )

  return (
    <html lang="uk" className={`${sans.variable} ${serif.variable}`}>
      {/*
        has-[...]: room under the footer for the fixed mobile "Add to cart" bar (73px) on product pages.
        overflow-x-clip: 100vw in .bleed-right includes a classic scrollbar (Windows); clip stops a sideways page scroll.
      */}
      <body className="flex min-h-screen flex-col overflow-x-clip bg-background font-sans has-[[data-sticky-buy]]:pb-[73px] lg:has-[[data-sticky-buy]]:pb-0">
        <CartProvider>
          <Header categories={categories} />
          <main className="container flex-1 py-8">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
