import 'server-only'

import type { Where } from 'payload'
import { getPayload } from './payload'
import type { Product, Category, Material, Review } from '@/payload-types'
import { sortByColor } from '@/lib/colors'
import type { Locale } from '@/i18n/routing'

/**
 * Data access layer. All product/category queries go through these
 * functions, so the frontend does not know Payload details and the filtering rules
 * (for example, only active) live in one place.
 *
 * Language: localized fields (title, color, descriptions, alt, material names) are returned
 * in `locale`; if a translation is empty, Ukrainian is used (fallbackLocale).
 */

const FALLBACK_LOCALE = 'uk' satisfies Locale

/** Get the list of active products (for the catalog). */
export async function getProducts(options: {
  locale: Locale
  categorySlug?: string
  /** Search by title (case-insensitive). */
  q?: string
  /** Only products ticked «Бестселер» in the admin. */
  bestseller?: boolean
  limit?: number
}): Promise<Product[]> {
  const payload = await getPayload()

  // Base filter: active products only.
  const where: Where = {
    active: { equals: true },
  }

  // Optional filtering by category via its slug.
  if (options.categorySlug) {
    where['category.slug'] = { equals: options.categorySlug }
  }

  const q = options.q?.trim()
  if (q) {
    // The title is searched in the site language and in Ukrainian: a filter on a localized field
    // looks only at that language's column (no fallback), so an untranslated product would be
    // missed on /pl and /en, and a shopper may type the Ukrainian name anyway.
    if (options.locale === FALLBACK_LOCALE) {
      where.title = { like: q }
    } else {
      const ukMatches = await payload.find({
        collection: 'products',
        where: { active: { equals: true }, title: { like: q } },
        locale: FALLBACK_LOCALE,
        select: {},
        limit: 1000,
        depth: 0,
        pagination: false,
      })
      where.or = [{ title: { like: q } }, { id: { in: ukMatches.docs.map((d) => d.id) } }]
    }
  }

  if (options.bestseller) {
    where.bestseller = { equals: true }
  }

  const result = await payload.find({
    collection: 'products',
    where,
    limit: options.limit ?? 100,
    sort: '-createdAt',
    locale: options.locale,
    fallbackLocale: FALLBACK_LOCALE,
    // depth: 2 pulls related media and category in as objects,
    // not just their ids.
    depth: 2,
  })

  // Every product (including every color of a model) is shown in the catalog
  // as a separate tile. The color link only works on the product page
  // through the switcher (getColorVariants).
  return result.docs
}

/**
 * Whether any active product is ticked «Бестселер». Until the owner ticks one,
 * the header hides the «Бестселери» link, so it never leads to an empty page.
 */
export async function hasBestsellers(): Promise<boolean> {
  const payload = await getPayload()
  const { totalDocs } = await payload.count({
    collection: 'products',
    where: { active: { equals: true }, bestseller: { equals: true } },
  })
  return totalDocs > 0
}

/** Get one product by slug (for the product page). */
export async function getProductBySlug(slug: string, locale: Locale): Promise<Product | null> {
  const payload = await getPayload()

  const result = await payload.find({
    collection: 'products',
    where: {
      slug: { equals: slug },
      active: { equals: true },
    },
    limit: 1,
    depth: 2,
    locale,
    fallbackLocale: FALLBACK_LOCALE,
  })

  return result.docs[0] ?? null
}

/**
 * All cards of one model (color variants).
 * Each color is a standalone product with its own slug; they are linked by the `model` field
 * (a relationship to the product-models collection).
 * Returned in the site-wide colour order (lib/colors).
 */
export async function getColorVariants(
  modelId: number | string,
  locale: Locale,
): Promise<Product[]> {
  if (!modelId) return []

  const payload = await getPayload()

  const result = await payload.find({
    collection: 'products',
    where: {
      model: { equals: modelId },
      active: { equals: true },
    },
    limit: 20,
    sort: 'createdAt',
    depth: 1,
    locale,
    fallbackLocale: FALLBACK_LOCALE,
  })

  return sortByColor(result.docs, (p) => p.colorName)
}

/** Get all categories (for the menu/filter). */
export async function getCategories(locale: Locale): Promise<Category[]> {
  const payload = await getPayload()

  const result = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'title',
    depth: 1,
    locale,
    fallbackLocale: FALLBACK_LOCALE,
  })

  return result.docs
}

/**
 * Categories that have at least one active product (menu, catalog chips, sitemap):
 * an empty category leads to a "0 товарів" page. A category appears by itself once
 * an active product is added to it.
 */
export async function getNonEmptyCategories(locale: Locale): Promise<Category[]> {
  const payload = await getPayload()
  const [categories, products] = await Promise.all([
    getCategories(locale),
    payload.find({
      collection: 'products',
      where: { active: { equals: true } },
      select: { category: true },
      limit: 5000,
      depth: 0,
      pagination: false,
    }),
  ])
  const used = new Set(
    products.docs.map((p) => String(typeof p.category === 'object' && p.category ? p.category.id : p.category)),
  )
  return categories.filter((c) => used.has(String(c.id)))
}

/** Materials marked "show on home" (fabric block on the home page). */
export async function getHomeMaterials(locale: Locale): Promise<Material[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'materials',
      where: { showOnHome: { equals: true } },
      sort: 'sortOrder',
      limit: 20,
      depth: 1,
      locale,
      fallbackLocale: FALLBACK_LOCALE,
    })
    return result.docs
  } catch {
    // The materials table is not created yet (before the migration); fall back to placeholders.
    return []
  }
}

/** Global "Delivery and payment" text (the Settings global). */
export async function getDeliveryPaymentHtml(): Promise<string | null> {
  try {
    const payload = await getPayload()
    const settings = await payload.findGlobal({ slug: 'settings' })
    return settings?.deliveryPaymentHtml ?? null
  } catch {
    // The settings table is not created yet (e.g. a build before the migration); do not crash the page.
    return null
  }
}

/** Slugs of all active products, for generateStaticParams (SSG/SEO). */
export async function getAllProductSlugs(): Promise<string[]> {
  const payload = await getPayload()

  const result = await payload.find({
    collection: 'products',
    where: { active: { equals: true } },
    limit: 1000,
    depth: 0,
  })

  return result.docs.map((doc) => doc.slug).filter(Boolean) as string[]
}

/**
 * Published reviews of a product and all its colour cards (one model = one set of reviews), newest first.
 */
export async function getProductReviews(locale: Locale, productIds: (number | string)[]): Promise<Review[]> {
  if (productIds.length === 0) return []
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'reviews',
      where: { status: { equals: 'approved' }, product: { in: productIds } },
      sort: '-createdAt',
      limit: 200,
      depth: 1,
      locale,
      fallbackLocale: FALLBACK_LOCALE,
      // As a visitor: only published reviews, whatever the caller passes
      overrideAccess: false,
    })
    return result.docs
  } catch {
    // The reviews table is not created yet (before the migration)
    return []
  }
}

/**
 * Reviews for the home page block: only published ones ticked «Показувати на головній». No fallback to
 * the latest: the owner expects an unticked review to stay off the home page.
 */
export async function getHomeReviews(locale: Locale): Promise<Review[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'reviews',
      where: { status: { equals: 'approved' }, showOnHome: { equals: true } },
      sort: '-createdAt',
      limit: 12,
      // depth 2: the card footer shows the product's first photo
      depth: 2,
      // The product title and colour on the card, in the page language
      locale,
      fallbackLocale: FALLBACK_LOCALE,
      overrideAccess: false,
    })
    return result.docs
  } catch {
    return []
  }
}
