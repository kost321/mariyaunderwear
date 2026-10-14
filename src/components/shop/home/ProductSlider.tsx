'use client'

import { useRef } from 'react'
import { ArrowButton } from './ArrowButton'

/**
 * Horizontal card slider on CSS scroll-snap; the arrows scroll
 * by the width of the visible area.
 */
export function ProductSlider({ children }: { children: React.ReactNode }) {
  const track = useRef<HTMLDivElement>(null)

  const scroll = (dir: 1 | -1) => {
    const el = track.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <div>
      <div
        ref={track}
        className="-mr-[var(--gutter)] flex snap-x snap-mandatory gap-4 overflow-x-auto pr-[var(--gutter)] [scrollbar-width:none] lg:gap-[27px] [&::-webkit-scrollbar]:hidden [&>*]:w-[70vw] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[304px]"
      >
        {children}
      </div>
      <div className="mt-8 hidden justify-center gap-3 sm:flex">
        <ArrowButton direction="prev" onClick={() => scroll(-1)} />
        <ArrowButton direction="next" onClick={() => scroll(1)} />
      </div>
    </div>
  )
}
