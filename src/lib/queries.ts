import 'server-only'

import type { Where } from 'payload'
import { getPayload } from './payload'
import type { Product, Category } from '@/payload-types'

/**
 * Data access layer. All product/category queries go through these
 * functions, so the frontend does not know Payload details and the filtering rules
 * (for example, only active) live in one place.
 */

/** Get the list of active products (for the catalog). */
export async function getProducts(options?: {
  categorySlug?: string
  /** Search by title (case-insensitive). */
  q?: string
  limit?: number
}): Promise<Product[]> {
  const payload = await getPayload()

  // Base filter: active products only.
  const where: Where = {
    active: { equals: true },
  }

  // Optional filtering by category via its slug.
  if (options?.categorySlug) {
    where['category.slug'] = { equals: options.categorySlug }
  }

  if (options?.q?.trim()) {
    where.title = { like: options.q.trim() }
  }

  const result = await payload.find({
    collection: 'products',
    where,
    limit: options?.limit ?? 100,
    sort: '-createdAt',
    // depth: 2 pulls related media and category in as objects,
    // not just their ids.
    depth: 2,
  })

  // Every product (including every color of a model) is shown in the catalog
  // as a separate tile. The color link only works on the product page
  // through the switcher (getColorVariants).
  return result.docs
}

/** Get one product by slug (for the product page). */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const payload = await getPayload()

  const result = await payload.find({
    collection: 'products',
    where: {
      slug: { equals: slug },
      active: { equals: true },
    },
    limit: 1,
    depth: 2,
  })

  return result.docs[0] ?? null
}

/**
 * All cards of one model (color variants).
 * Each color is a standalone product with its own slug; they are linked by the `model` field
 * (a relationship to the product-models collection).
 * Returned in the same order as they were created in the admin.
 */
export async function getColorVariants(
  modelId: number | string,
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
  })

  return result.docs
}

/** Get all categories (for the menu/filter). */
export async function getCategories(): Promise<Category[]> {
  const payload = await getPayload()

  const result = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'title',
    depth: 1,
  })

  return result.docs
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
