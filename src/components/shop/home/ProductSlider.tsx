'use client'

import { Children, useRef } from 'react'
import { cn, scrollBehavior } from '@/lib/utils'
import { ArrowButton } from './ArrowButton'

/**
 * Horizontal card slider on CSS scroll-snap; the arrows scroll by the width of the visible area.
 * Desktop: the row stays within the content and shows exactly `perView` whole cards (four products, three reviews).
 * Mobile/tablet: the row runs to the screen edge (the gutter), so the next card peeks out.
 */
export function ProductSlider({ children, perView = 4 }: { children: React.ReactNode; perView?: 3 | 4 }) {
  const track = useRef<HTMLDivElement>(null)

  const scroll = (dir: 1 | -1) => {
    const el = track.current
    // A full width moves by a page of cards; scroll-snap lands it on a card edge
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: scrollBehavior() })
  }

  // perView cards fit on a desktop row: with no more than that, the arrows would scroll nothing
  const scrollable = Children.count(children) > perView

  return (
    <div>
      <div
        ref={track}
        className={cn(
          '-mr-[var(--gutter)] flex snap-x snap-mandatory gap-4 overflow-x-auto pr-[var(--gutter)] [scrollbar-width:none] lg:mr-0 lg:gap-[27px] lg:pr-0 [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 [&>*]:snap-start',
          perView === 4
            ? '[&>*]:w-[70vw] sm:[&>*]:w-[304px] lg:[&>*]:w-[calc((100%-3*27px)/4)]'
            : // Three wider cards (reviews): text reads better in a wider column
              '[&>*]:w-[82vw] sm:[&>*]:w-[360px] lg:[&>*]:w-[calc((100%-2*27px)/3)]',
        )}
      >
        {children}
      </div>
      {scrollable && (
        <div className="mt-8 hidden justify-center gap-3 sm:flex">
          <ArrowButton direction="prev" onClick={() => scroll(-1)} />
          <ArrowButton direction="next" onClick={() => scroll(1)} />
        </div>
      )}
    </div>
  )
}
