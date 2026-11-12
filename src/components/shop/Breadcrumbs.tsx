import { Fragment } from 'react'
import Link from 'next/link'

export type Crumb = { name: string; href?: string }

/**
 * Small "Головна / Каталог" trail above a page title. The last crumb is the current page (no link).
 * Pair it with breadcrumbsLd (components/shop/JsonLd) for Google.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Хлібні крихти" className="text-xs text-brown/70">
      {items.map((item, i) => (
        <Fragment key={item.name}>
          {i > 0 && ' / '}
          {item.href && i < items.length - 1 ? (
            <Link href={item.href} className="hover:text-brown">
              {item.name}
            </Link>
          ) : (
            <span className="text-brown" aria-current="page">
              {item.name}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
