'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn, plural } from '@/lib/utils'

/** One color of the hero product: its photo (if any), page and swatch. */
export type HeroItem = { url?: string; alt: string; href: string; name?: string; hex?: string; lead?: boolean }

// Product photos are shot on a flat #eaeaec backdrop (square 1600px): a panel of the same colour
// makes photo and panel read as one wide banner. Keep lg:bg-[#eaeaec] on the section in sync
// (Tailwind needs the class written out literally).
const STUDIO_BACKDROP = 'bg-[#eaeaec]'

/**
 * Text column of the banner. The page's only H1 is the full store description in a small
 * line (for search engines and readers alike); the eye gets a short phrase in large type instead of
 * four lines of caps. The color swatches switch the photo, so one picture still shows the whole range.
 */
function HeroText({
  items,
  active,
  onSelect,
  className,
}: {
  items: HeroItem[]
  active: number
  onSelect: (i: number) => void
  className?: string
}) {
  const swatchCount = items.filter((i) => i.hex).length
  return (
    <div className={className}>
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
          <div className="flex gap-3" role="group" aria-label="Кольори">
            {items.map((item, i) =>
              !item.hex ? null : !item.url ? (
                // No photo to switch to yet: the swatch opens that color's page instead
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.name ?? item.alt}
                  className="relative h-8 w-8 rounded-full border border-brown/30 transition-transform before:absolute before:-inset-1.5 before:rounded-full before:content-[''] hover:scale-110"
                  style={{ backgroundColor: item.hex }}
                />
              ) : (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => onSelect(i)}
                  aria-pressed={i === active}
                  aria-label={item.name ?? item.alt}
                  className={cn(
                    // 32px swatch, 44px tap target; gap-3 keeps the targets from overlapping
                    "relative h-8 w-8 rounded-full border border-brown/30 transition-transform before:absolute before:-inset-1.5 before:rounded-full before:content-['']",
                    i === active ? 'ring-1 ring-ink ring-offset-2' : 'hover:scale-110',
                  )}
                  style={{ backgroundColor: item.hex }}
                />
              ),
            )}
          </div>
          {/* The selected colour is named here, not in a hover tooltip that floats away from the swatch */}
          <span className="text-sm text-brown" aria-live="polite">
            {items[active]?.name && <span className="text-ink">{items[active].name} · </span>}
            {swatchCount} {plural(swatchCount, ['колір', 'кольори', 'кольорів'])}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * First screen: a banner. Desktop — one wide panel in the studio backdrop colour, the text on the left and
 * the model filling the right half; phones — a regular photo on top and the text below on white.
 * The swatches switch the photo, so one picture still shows the whole range.
 */
export function HeroSection({ items }: { items: HeroItem[] }) {
  // Swatches are in colour order; the photo shown on load is the lead (newest) colour
  const [active, setActive] = useState(() => Math.max(0, items.findIndex((i) => i.lead)))
  const current = items[active]

  return (
    <section className="flex flex-col-reverse gap-6 lg:relative lg:block lg:overflow-hidden lg:rounded-card lg:bg-[#eaeaec]">
      <HeroText
        items={items}
        active={active}
        onSelect={setActive}
        className="lg:relative lg:z-10 lg:max-w-[50%] lg:py-20 lg:pl-16 xl:max-w-[700px]"
      />
      {current?.url && (
        <Link
          href={current.href}
          // Desktop: both edges fade into the panel, as some photos have a backdrop a shade off #eaeaec or a light vignette
          className={cn(
            'relative block aspect-[4/5] overflow-hidden rounded-card',
            STUDIO_BACKDROP,
            'lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-1/2 lg:rounded-none xl:w-[58%] lg:bg-transparent lg:[mask-image:linear-gradient(to_right,transparent,black_25%,black_85%,transparent)]',
          )}
        >
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt}
            fill
            priority
            quality={90}
            sizes="(max-width: 1024px) 100vw, 720px"
            // The model is centred in a square shot: cover + a top anchor makes her fill the panel height
            className="object-cover object-[50%_20%] lg:object-[50%_10%]"
          />
        </Link>
      )}
    </section>
  )
}
