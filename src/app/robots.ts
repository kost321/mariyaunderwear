import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

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
        '/cart',
        '/catalog?*size=',
        '/catalog?*color=',
        '/catalog?*min=',
        '/catalog?*max=',
        '/catalog?*q=',
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
