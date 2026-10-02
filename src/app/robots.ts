import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

/**
 * /robots.txt: сайт відкритий для індексації, крім адмінки, API, кошика
 * і сторінок каталогу з фільтрами (розмір, колір, ціна, пошук) — це дублі
 * одного й того ж каталогу. Сторінки категорій лишаються відкритими.
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
