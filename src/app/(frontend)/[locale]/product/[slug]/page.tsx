import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { routing, ogLocales, localePath } from '@/i18n/routing'
import {
  getProductBySlug,
  getAllProductSlugs,
  getColorVariants,
} from '@/lib/queries'
import { getMediaUrl } from '@/lib/media'
import { ProductDetails } from '@/components/shop/ProductDetails'
import { ProductDescription } from '@/components/shop/ProductDescription'
import { ProductCard } from '@/components/shop/ProductCard'
import { alternates } from '@/lib/seo'
import type { Product } from '@/payload-types'
import { isProductInStock } from '@/lib/stock'

type Params = { params: Promise<{ locale: Locale; slug: string }> }

/**
 * ISR: the page is static, but at least once every 60 seconds Next rebuilds
 * it with fresh data from the DB. Admin edits (price, colors, model
 * variants) are picked up without a manual redeploy.
 */
export const revalidate = 60

/**
 * SSG: pre-generate pages for all active products in every language.
 * Makes the pages static and as SEO-friendly as possible.
 * The slug is shared by all languages: /ua/product/x, /pl/product/x, /en/product/x.
 */
export async function generateStaticParams() {
  try {
    const slugs = await getAllProductSlugs()
    return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
  } catch {
    // DB is unavailable during the build (for example on Railway without a connected database)
    return []
  }
}

const serverUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

/** HTML description → plain text (for meta description and JSON-LD). */
function toPlainText(html?: string | null): string {
  return (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`
}

/** Dynamic SEO metadata based on the product. */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params
  const t = await getTranslations({ locale, namespace: 'Meta' })
  const product = await getProductBySlug(slug, locale)
  if (!product) return { title: t('productNotFound') }

  const ogImage = getMediaUrl(product.images?.[0]?.image)
  // title is not null in practice: required in Ukrainian + fallback to uk.
  const title = product.title ?? ''

  const plain = toPlainText(product.description)
  const description = plain
    ? truncate(plain, 155)
    : t('productDescription', { title })

  return {
    title,
    description,
    alternates: alternates(locale, `/product/${slug}`),
    // The page openGraph fully replaces the layout openGraph, so locale is repeated.
    openGraph: {
      locale: ogLocales[locale],
      title,
      description,
      url: `${localePath(locale)}/product/${slug}`,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: Params) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Product')
  const product = await getProductBySlug(slug, locale)

  // If the product does not exist or is inactive, return 404.
  if (!product) notFound()

  // Other color variants of the same model (each one is a separate card).
  // product.model arrives as an object (depth: 2) or a number; take the id.
  const modelId =
    typeof product.model === 'object' && product.model !== null
      ? product.model.id
      : product.model
  const [colorVariants] = await Promise.all([
    modelId ? getColorVariants(modelId, locale) : Promise.resolve([]),
  ])

  // relatedProducts: products hand-picked in the admin (relationship, hasMany).
  // With depth: 2 Payload returns them as full objects, not just ids.
  const relatedProducts = (product.relatedProducts ?? []).filter(
    (item): item is Product => typeof item === 'object' && item !== null,
  )

  // Structured data for Google (price, availability, photos in search results).
  // Same rule as the page and the order API (lib/stock): empty stock = not in stock.
  const outOfStock = !isProductInStock(product.sizes)
  const imageUrls = (product.images ?? [])
    .map((item) => getMediaUrl(item.image))
    .filter((url): url is string => Boolean(url))
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    ...(imageUrls.length > 0 && { image: imageUrls }),
    ...(product.sku && { sku: product.sku }),
    ...(toPlainText(product.description) && {
      description: truncate(toPlainText(product.description), 500),
    }),
    brand: { '@type': 'Brand', name: 'Mariya Underwear' },
    offers: {
      '@type': 'Offer',
      url: `${serverUrl}${localePath(locale)}/product/${slug}`,
      priceCurrency: 'UAH',
      price: product.price,
      availability: outOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
    },
  }

  return (
    // pb-20 leaves room for the fixed "Add to cart" button on mobile
    <article className="pb-20 lg:pb-0">
      {/* Escape "<" so the product text cannot close the script tag */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <nav className="mb-6 hidden lg:block">
        <Link href="/catalog" aria-label={t('backToCatalog')} className="inline-block transition-opacity hover:opacity-70">
          <Image src="/brand/arrow-long.svg" alt="" width={61} height={14} className="h-[14px] w-[61px]" />
        </Link>
      </nav>

      <ProductDetails product={product} colorVariants={colorVariants} />

      {/* Description, composition and care: under the gallery at full block width, as in the design */}
      <div className="mx-auto mt-12 lg:mt-[100px] lg:max-w-[911px]">
        <ProductDescription
          sections={[
            { html: product.description },
            // "Характеристики:" is already in the admin text itself, so we do not add our own heading
            { html: product.descriptionHtml },
            { title: t('careTitle'), html: product.careHtml },
          ]}
        />
      </div>

      {/* "Frequently bought together": products hand-picked in the admin */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 lg:mt-[100px]">
          <h2 className="border-b border-brown/40 pb-5 font-serif text-xl uppercase leading-10 tracking-[2px] text-brown">
            {t('related')}
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 lg:gap-x-[41px] lg:gap-y-12">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
