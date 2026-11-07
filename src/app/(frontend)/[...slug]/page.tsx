import { notFound } from 'next/navigation'

/**
 * Any address that matches no page. The site has two root layouts ((frontend) and (payload)),
 * so Next has no shared 404 for unknown URLs; this catch-all sends them to (frontend)/not-found.tsx,
 * shown with the site header and footer. Static routes (/admin, /api, /cart…) take precedence over it.
 */
export default function CatchAll() {
  notFound()
}
