import type { MetadataRoute } from 'next'
import { routing, localePath } from '@/i18n/routing'

const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// Closed pages, without the language prefix; repeated below for /ua, /pl, /en.
const localizedDisallow = [
  '/cart',
  '/catalog?*size=',
  '/catalog?*color=',
  '/catalog?*min=',
  '/catalog?*max=',
  '/catalog?*q=',
]

/**
 * /robots.txt: the site is open to indexing except the admin, the API, the cart
 * and catalog pages with filters (size, color, price, search), which are duplicates
 * of the same catalog. Category pages stay open.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api',
        ...routing.locales.flatMap((l) => localizedDisallow.map((p) => `${localePath(l)}${p}`)),
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
