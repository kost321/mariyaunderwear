import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing, localePath } from './i18n/routing'

const intl = createMiddleware(routing)

/** First path segments that already name a language (/uk is sent to /ua by next.config.mjs). */
const LANGUAGE_SEGMENTS = new Set(routing.locales.map((l) => localePath(l).slice(1)))

/**
 * Мовний роутинг фронту.
 * - «/» → 307 на мову з cookie / Accept-Language, інакше /ua (next-intl).
 * - Старі адреси без мови (/catalog, /product/…, /oferta — так їх знає Google з часів до
 *   мультимовності) → 308 на ту саму сторінку в /ua: постійний редирект, щоб Google переніс
 *   на нову адресу все, що зібрав для старої. Ці сторінки завжди були українською.
 */
export default function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  const first = pathname.split('/')[1]
  if (pathname !== '/' && !LANGUAGE_SEGMENTS.has(first)) {
    const url = req.nextUrl.clone()
    url.pathname = `${localePath(routing.defaultLocale)}${pathname}`
    url.search = search
    return NextResponse.redirect(url, 308)
  }
  return intl(req)
}

export const config = {
  // Адмінку Payload, API, службові шляхи Next і файли (favicon.ico,
  // sitemap.xml, robots.txt…) не чіпаємо.
  matcher: ['/((?!admin|api|_next|_vercel|.*\\..*).*)'],
}
