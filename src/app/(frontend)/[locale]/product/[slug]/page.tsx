import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { routing, ogLocales } from '@/i18n/routing'
import {
  getProductBySlug,
  getAllProductSlugs,
  getColorVariants,
} from '@/lib/queries'
import { getMediaUrl } from '@/lib/media'
import { ProductDetails } from '@/components/shop/ProductDetails'
import { alternates } from '@/lib/seo'
import type { Product } from '@/payload-types'

type Params = { params: Promise<{ locale: Locale; slug: string }> }

/**
 * ISR: сторінка статична, але не рідше ніж раз на 60 секунд Next пересобирає
 * її з актуальними даними з БД. Правки в адмінці (ціна, кольори, варіанти
 * моделі) підхоплюються без ручного редеплою.
 */
export const revalidate = 60

/**
 * SSG: заранее генерируем страницы всех активных товаров на всех мовах.
 * Делает страницы статичными и максимально SEO-friendly.
 * slug спільний для всіх мов: /uk/product/x, /pl/product/x, /en/product/x.
 */
export async function generateStaticParams() {
  try {
    const slugs = await getAllProductSlugs()
    return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
  } catch {
    // БД недоступна під час білду (наприклад, на Railway без підключеної бази)
    return []
  }
}

/** Динамические SEO-метаданные на основе товара. */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params
  const t = await getTranslations({ locale, namespace: 'Meta' })
  const product = await getProductBySlug(slug, locale)
  if (!product) return { title: t('productNotFound') }

  const ogImage = getMediaUrl(product.images?.[0]?.image)
  // title не null на практиці: обов'язковий українською + фолбек на uk.
  const title = product.title ?? ''

  return {
    title,
    description: t('productDescription', { title }),
    alternates: alternates(locale, `/product/${slug}`),
    // openGraph сторінки повністю замінює openGraph з layout — повторюємо locale.
    openGraph: {
      locale: ogLocales[locale],
      title,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: Params) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Product')
  const product = await getProductBySlug(slug, locale)

  // Если товара нет или он неактивен — 404.
  if (!product) notFound()

  // Другие цветовые варианты этой же модели (каждый — отдельная карточка).
  // product.model приходит объектом (depth: 2) или числом — берём id.
  const modelId =
    typeof product.model === 'object' && product.model !== null
      ? product.model.id
      : product.model
  const [colorVariants] = await Promise.all([
    modelId ? getColorVariants(modelId, locale) : Promise.resolve([]),
  ])

  // relatedProducts — товари, вручну обрані в адмінці (relationship, hasMany).
  // Payload с depth: 2 повертає їх повними об'єктами, а не просто id.
  const relatedProducts = (product.relatedProducts ?? []).filter(
    (item): item is Product => typeof item === 'object' && item !== null,
  )

  return (
    <article className="space-y-10">
      <nav className="text-sm text-muted-foreground">
        <Link href="/catalog" className="hover:text-foreground">
          {t('backToCatalog')}
        </Link>
      </nav>

      <ProductDetails
        product={product}
        colorVariants={colorVariants}
        relatedProducts={relatedProducts}
      />
    </article>
  )
}
