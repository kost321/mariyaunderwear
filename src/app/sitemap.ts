import type { MetadataRoute } from 'next'
import { getPayload } from '@/lib/payload'

const base = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

// The sitemap reads the DB on every request, not at build time: during the build
// (Railway) the DB may be missing, and the sitemap would then permanently contain
// only the static URLs.
export const dynamic = 'force-dynamic'

/**
 * /sitemap.xml: home, catalog, categories and all active products.
 * If the DB is unavailable, return only the static URLs instead of crashing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/catalog`, changeFrequency: 'daily', priority: 0.9 },
  ]

  try {
    const payload = await getPayload()
    const [categories, products] = await Promise.all([
      payload.find({ collection: 'categories', limit: 100, depth: 0, pagination: false }),
      payload.find({
        collection: 'products',
        where: { active: { equals: true } },
        limit: 5000,
        depth: 0,
        pagination: false,
      }),
    ])

    for (const category of categories.docs) {
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
