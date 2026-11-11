import type { MetadataRoute } from 'next'
import { getPayload } from '@/lib/payload'
import { getNonEmptyCategories } from '@/lib/queries'

const base = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

// The sitemap reads the DB on every request, not at build time: during the build
// (Railway) the DB may be missing, and the sitemap would then permanently contain
// only the static URLs.
export const dynamic = 'force-dynamic'

/**
 * /sitemap.xml: home, catalog, non-empty categories and all active products.
 * If the DB is unavailable, return only the static URLs instead of crashing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/catalog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/cooperation`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/contacts`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/oferta`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${base}/delivery`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  try {
    const payload = await getPayload()
    // Only categories with products: an empty category is a thin "0 товарів" page
    const [categories, products] = await Promise.all([
      getNonEmptyCategories(),
      payload.find({
        collection: 'products',
        where: { active: { equals: true } },
        limit: 5000,
        depth: 0,
        pagination: false,
      }),
    ])

    for (const category of categories) {
      if (!category.slug) continue
      entries.push({
        url: `${base}/catalog?category=${encodeURIComponent(category.slug)}`,
        lastModified: category.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }

    for (const product of products.docs) {
      if (!product.slug) continue
      entries.push({
        url: `${base}/product/${encodeURIComponent(product.slug)}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  } catch (err) {
    console.error('[sitemap] БД недоступна, віддаємо лише статичні адреси:', err)
  }

  return entries
}
