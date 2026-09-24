import type { MetadataRoute } from 'next'
import { routing, localePath } from '@/i18n/routing'
import { getAllProductSlugs } from '@/lib/queries'

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// Перегенеровується раз на годину — нові товари потрапляють у sitemap без редеплою.
export const revalidate = 3600

/** Кожна сторінка × кожна мова, з hreflang-альтернативами. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let slugs: string[] = []
  try {
    slugs = await getAllProductSlugs()
  } catch {
    // БД недоступна під час білду — віддаємо хоча б статичні сторінки.
  }

  const paths = ['', '/catalog', ...slugs.map((slug) => `/product/${slug}`)]

  return paths.flatMap((path) => {
    const languages = Object.fromEntries(
      routing.locales.map((l) => [l, `${serverUrl}${localePath(l)}${path}`]),
    )
    return routing.locales.map((locale) => ({
      url: `${serverUrl}${localePath(locale)}${path}`,
      alternates: { languages },
    }))
  })
}
