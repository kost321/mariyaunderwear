import { Fragment } from 'react'
import Link from 'next/link'

export type Crumb = { name: string; href?: string }

/**
 * Small "Головна / Каталог" trail above a page title. The last crumb is the current page (no link).
 * Pair it with breadcrumbsLd (components/shop/JsonLd) for Google.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Хлібні крихти" className="text-xs text-brown">
      {items.map((item, i) => (
        <Fragment key={item.name}>
          {i > 0 && ' / '}
          {item.href && i < items.length - 1 ? (
            <Link
              href={item.href}
              // 15px of text; the invisible strip above and below makes it a 44px tap target
              className="relative transition-colors before:absolute before:inset-x-0 before:-inset-y-3.5 before:content-[''] hover:text-ink"
            >
              {item.name}
            </Link>
          ) : (
            <span className="text-ink" aria-current="page">
              {item.name}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
