'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Table of contents of a legal page. The section being read is highlighted as the page scrolls:
 * an IntersectionObserver watches a thin band near the top of the screen, and the section crossing
 * it becomes active. Between sections (the band falls into a gap) the previous one stays active;
 * at the very bottom of the page the last section is active, above the first one none is.
 */
export function LegalToc({
  items,
  numbered = true,
  className,
}: {
  items: { id: string; title: string }[]
  /** "1. Основні терміни" for numbered legal sections; plain titles otherwise */
  numbered?: boolean
  className?: string
}) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting)
        if (hit.length) setActive(hit[hit.length - 1].target.id)
      },
      // The band from 15% to 25% of the viewport height
      { rootMargin: '-15% 0px -75% 0px' },
    )
    for (const { id } of items) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    // The last sections are short: the page ends before they reach the band, so at the very bottom
    // the last one is active
    // Above the first section (back at the top of the page) nothing is active
    const first = items[0] && document.getElementById(items[0].id)
    const onScroll = () => {
      const { scrollHeight } = document.documentElement
      if (window.innerHeight + window.scrollY >= scrollHeight - 4) setActive(items[items.length - 1]?.id ?? null)
      else if (first && first.getBoundingClientRect().top > window.innerHeight * 0.25) setActive(null)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [items])

  return (
    <nav aria-label="Зміст" className={cn('rounded-card bg-[#f4efeb] px-6 py-5 lg:px-7 lg:py-6', className)}>
      <p className="text-base font-medium text-ink">Зміст</p>
      <ol className="mt-3 space-y-1.5 text-[15px] leading-6">
        {items.map(({ id, title }, i) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={active === id ? 'location' : undefined}
              className={cn(
                'block underline-offset-4 transition-colors hover:text-ink hover:underline',
                active === id ? 'font-medium text-ink' : 'text-brown',
              )}
            >
              {numbered && `${i + 1}. `}
              {title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
