import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

/**
 * Мовний роутинг фронту: «/» → /uk (або мова з cookie / Accept-Language),
 * /catalog → /uk/catalog.
 */
export default createMiddleware(routing)

export const config = {
  // Адмінку Payload, API, службові шляхи Next і файли (favicon.ico,
  // sitemap.xml, robots.txt…) не чіпаємо.
  matcher: ['/((?!admin|api|_next|_vercel|.*\\..*).*)'],
}
