'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn, plural } from '@/lib/utils'

/** One color of the hero product: its photo, page and swatch. */
export type HeroItem = { url: string; alt: string; href: string; name?: string; hex?: string }

/**
 * First screen of the home page: text on the left, one large photo on the right.
 * The page's only H1 is the full store description in a small line (for search engines and
 * readers alike); the eye gets a short phrase in large type instead of four lines of caps.
 * The color swatches switch the photo, so one picture still shows the whole range.
 * Search lives in the header (search icon), no season in the text: it goes stale.
 */
export function HeroSection({ items }: { items: HeroItem[] }) {
  const [active, setActive] = useState(0)
  const current = items[active]
  const swatchCount = items.filter((i) => i.hex).length

  return (
    <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-16">
      <div className="lg:py-10">
        <h1 className="text-sm text-brown lg:text-base">Жіночі нічні сорочки та домашній одяг</h1>
        <p className="mt-3 font-serif text-[44px] leading-[48px] text-ink-text lg:mt-4 lg:text-[72px] lg:leading-[76px]">
          Ніжність щодня
        </p>
        <p className="mt-5 text-base leading-6 text-brown lg:mt-6">Виготовлено в Україні. Розміри S–2XL</p>

        <Link
          href="/catalog"
          className="mt-8 flex h-11 w-[265px] items-center justify-between rounded-card bg-ink pl-7 pr-5 text-base text-white transition-colors hover:bg-ink/90 lg:mt-10"
        >
          До каталогу
          {/* The arrow file is brown; brightness-0 + invert turns it white on the dark button */}
          <Image src="/brand/arrow-long.svg" alt="" width={49} height={14} className="-scale-x-100 brightness-0 invert" />
        </Link>

        {swatchCount > 1 && (
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex gap-2" role="group" aria-label="Кольори">
              {items.map((item, i) =>
                item.hex ? (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-pressed={i === active}
                    aria-label={item.name ?? item.alt}
                    title={item.name}
                    className={cn(
                      'h-7 w-7 rounded-full border border-brown/30 transition-transform',
                      i === active ? 'ring-1 ring-ink ring-offset-2' : 'hover:scale-110',
                    )}
                    style={{ backgroundColor: item.hex }}
                  />
                ) : null,
              )}
            </div>
            <span className="text-sm text-brown/80">
              {swatchCount} {plural(swatchCount, ['колір', 'кольори', 'кольорів'])}
            </span>
          </div>
        )}
      </div>

      {current && (
        <Link
          href={current.href}
          className="relative block aspect-[4/5] overflow-hidden rounded-card border border-[#d7d7d7]/60 bg-placeholder/40"
        >
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt}
            fill
            priority
            quality={90}
            sizes="(max-width: 1024px) 100vw, 480px"
            className="object-cover"
          />
        </Link>
      )}
    </section>
  )
}
