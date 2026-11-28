import type { MetadataRoute } from 'next'
import { routing, localePath } from '@/i18n/routing'
import { getPayload } from '@/lib/payload'
import { getNonEmptyCategories } from '@/lib/queries'

const base = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

// The sitemap reads the DB on every request, not at build time: during the build
// (Railway) the DB may be missing, and the sitemap would then permanently contain
// only the static URLs.
export const dynamic = 'force-dynamic'

type Page = Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'> & { path: string }

/**
 * /sitemap.xml: home, catalog, info pages, non-empty categories and all active products, each in every
 * language with hreflang alternates. If the DB is unavailable, return only the static URLs instead of crashing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: Page[] = [
    { path: '', changeFrequency: 'weekly', priority: 1 },
    { path: '/catalog', changeFrequency: 'daily', priority: 0.9 },
    { path: '/cooperation', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/contacts', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/oferta', changeFrequency: 'yearly', priority: 0.1 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.1 },
    { path: '/delivery', changeFrequency: 'yearly', priority: 0.3 },
  ]

  try {
    const payload = await getPayload()
    // Only categories with products: an empty category is a thin "0 товарів" page
    const [categories, products] = await Promise.all([
      getNonEmptyCategories(routing.defaultLocale),
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
      pages.push({
        path: `/catalog?category=${encodeURIComponent(category.slug)}`,
        lastModified: category.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }

    for (const product of products.docs) {
      if (!product.slug) continue
      pages.push({
        path: `/product/${encodeURIComponent(product.slug)}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  } catch (err) {
    console.error('[sitemap] БД недоступна, віддаємо лише статичні адреси:', err)
  }

  return pages.flatMap(({ path, ...rest }) => {
    const languages = Object.fromEntries(routing.locales.map((l) => [l, `${base}${localePath(l)}${path}`]))
    return routing.locales.map((locale) => ({
      ...rest,
      url: `${base}${localePath(locale)}${path}`,
      alternates: { languages },
    }))
  })
}
