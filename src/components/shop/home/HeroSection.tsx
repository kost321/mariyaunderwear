'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowButton } from './ArrowButton'

export type HeroImage = { url: string; alt: string; href: string }

const frame = 'relative block overflow-hidden rounded-card border border-[#d7d7d7]/60 bg-placeholder/40'

/** Product photo or an empty placeholder, as in the design, if there is no photo. */
function Photo({ image, sizes, className }: { image?: HeroImage; sizes: string; className?: string }) {
  if (!image) return <div aria-hidden className={`${frame} ${className ?? ''}`} />
  return (
    <Link href={image.href} className={`${frame} ${className ?? ''}`}>
      <Image src={image.url} alt={image.alt} fill quality={85} sizes={sizes} className="object-cover" />
    </Link>
  )
}

/**
 * First screen of the home page: search, "New collection", 2 small + 2 large photos
 * and arrows that cycle through the photos.
 */
export function HeroSection({ images }: { images: HeroImage[] }) {
  const [offset, setOffset] = useState(0)
  const count = images.length
  // Four slots of the current "frame": 0-1 small on the left, 2-3 large on the right.
  // If there are fewer than four photos, the remaining slots stay placeholders.
  const at = (i: number) => (i < count ? images[(offset + i) % count] : undefined)
  const canScroll = count > 4

  return (
    <section className="grid gap-8 lg:grid-cols-[397px_1fr_1fr] lg:gap-x-9">
      <div className="flex flex-col lg:h-[606px]">
        <form action="/catalog" role="search" className="relative">
          <Image src="/brand/search.svg" alt="" width={17} height={16} className="absolute left-5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            name="q"
            placeholder="Пошук"
            aria-label="Пошук товарів"
            className="h-[50px] w-full rounded-card bg-cream/70 pl-12 pr-6 text-xs tracking-[2px] text-brown placeholder:text-right placeholder:text-brown focus:outline-none focus:ring-1 focus:ring-brown/40"
          />
        </form>

        <h1 className="mt-12 font-serif text-[40px] uppercase leading-[40px] tracking-[2px] text-ink-text lg:mt-[80px] lg:text-5xl">
          Нова
          <br />
          колекція
        </h1>
        <p className="mt-2 font-script text-xl leading-6 tracking-[2px] text-brown">
          Літо
          <br />
          2026
        </p>

        <div className="mt-auto hidden grid-cols-2 gap-9 pt-10 lg:grid">
          <Photo image={at(0)} sizes="171px" className="h-[185px]" />
          <Photo image={at(1)} sizes="171px" className="h-[185px]" />
        </div>

        <div className="mt-8 flex items-center justify-between lg:mt-[61px]">
          <Link
            href="/catalog"
            className="flex h-10 w-[265px] items-center justify-between rounded-card bg-cream/70 pl-7 pr-5 text-base text-brown transition-colors hover:bg-cream"
          >
            До магазину
            <Image src="/brand/arrow-long.svg" alt="" width={49} height={14} className="-scale-x-100" />
          </Link>
          {canScroll && (
            <div className="hidden gap-3 lg:flex">
              <ArrowButton direction="prev" onClick={() => setOffset((o) => (o - 1 + count) % count)} />
              <ArrowButton direction="next" onClick={() => setOffset((o) => (o + 1) % count)} />
            </div>
          )}
        </div>
      </div>

      {/* Desktop: two large photos */}
      <Photo image={at(2)} sizes="800px" className="hidden h-[606px] lg:block" />
      <Photo image={at(3)} sizes="800px" className="hidden h-[606px] lg:block" />

      {/* Mobile: a horizontal strip of photos */}
      <div className="-mx-[var(--gutter)] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter)] pb-2 [scrollbar-width:none] lg:hidden">
        {(count ? images : [undefined, undefined, undefined]).map((image, i) => (
          <Photo key={i} image={image} sizes="45vw" className="aspect-[3/5] w-[45vw] shrink-0 snap-start" />
        ))}
      </div>
    </section>
  )
}
