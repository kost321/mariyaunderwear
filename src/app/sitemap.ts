import type { MetadataRoute } from 'next'
import { getPayload } from '@/lib/payload'

const base = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

// Карта сайту читає БД на кожен запит, а не під час білду: на білді
// (Railway) бази може не бути, і тоді в sitemap назавжди лишились би
// самі статичні адреси.
export const dynamic = 'force-dynamic'

/**
 * /sitemap.xml: головна, каталог, категорії та всі активні товари.
 * Якщо БД недоступна — віддаємо лише статичні адреси, а не падаємо.
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
