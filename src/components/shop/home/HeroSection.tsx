'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn, plural } from '@/lib/utils'

/** One color of the hero product: its photo (if any), page and swatch. */
export type HeroItem = { url?: string; alt: string; href: string; name?: string; hex?: string }

/**
 * First-screen layouts, switchable for the client demo via /?hero=a|b|c (see HeroVariantSwitch):
 *  a — text + one large photo (default);
 *  b — text + two large photos (two colors side by side);
 *  c — banner: a wide panel in the studio backdrop colour, photo on the right blending into it.
 */
export type HeroVariant = 'a' | 'b' | 'c'

// Product photos are shot on a flat #eaeaec backdrop (square 1600px): a panel of the same colour
// makes photo and panel read as one wide banner in variant c. Keep lg:bg-[#eaeaec] in variant c in sync
// (Tailwind needs the class written out literally).
const STUDIO_BACKDROP = 'bg-[#eaeaec]'

const photoFrame = 'relative block overflow-hidden rounded-card border border-[#d7d7d7]/60 bg-placeholder/40'

/**
 * Text column shared by all variants. The page's only H1 is the full store description in a small
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
          <div className="flex gap-2" role="group" aria-label="Кольори">
            {items.map((item, i) =>
              !item.hex ? null : !item.url ? (
                // No photo to switch to yet: the swatch opens that color's page instead
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.name ?? item.alt}
                  className="h-7 w-7 rounded-full border border-brown/30 transition-transform hover:scale-110"
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
                    'h-7 w-7 rounded-full border border-brown/30 transition-transform',
                    i === active ? 'ring-1 ring-ink ring-offset-2' : 'hover:scale-110',
                  )}
                  style={{ backgroundColor: item.hex }}
                />
              ),
            )}
          </div>
          {/* The selected colour is named here, not in a hover tooltip that floats away from the swatch */}
          <span className="text-sm text-brown/80" aria-live="polite">
            {items[active]?.name && <span className="text-ink">{items[active].name} · </span>}
            {swatchCount} {plural(swatchCount, ['колір', 'кольори', 'кольорів'])}
          </span>
        </div>
      )}
    </div>
  )
}

function Photo({ item, sizes, className }: { item: HeroItem; sizes: string; className?: string }) {
  if (!item.url) return null
  return (
    <Link href={item.href} className={cn(photoFrame, className)}>
      <Image key={item.url} src={item.url} alt={item.alt} fill priority quality={90} sizes={sizes} className="object-cover" />
    </Link>
  )
}

export function HeroSection({ items, variant = 'a' }: { items: HeroItem[]; variant?: HeroVariant }) {
  const [active, setActive] = useState(0)
  const current = items[active]
  // Only colors with a photo can be shown; variant b pairs the current one with the next of those
  const withPhotos = items.filter((i) => i.url)
  const text = (className?: string) => (
    <HeroText items={items} active={active} onSelect={setActive} className={className} />
  )

  if (variant === 'b') {
    // Two colors side by side: the selected one and the next
    const second = withPhotos.length > 1 ? withPhotos[(withPhotos.indexOf(current) + 1) % withPhotos.length] : undefined
    return (
      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-16">
        {text('lg:py-10')}
        {current && (
          <div className="grid grid-cols-2 gap-3 lg:gap-6">
            <Photo item={current} sizes="(max-width: 1024px) 50vw, 340px" className="aspect-[3/4]" />
            {second && <Photo item={second} sizes="(max-width: 1024px) 50vw, 340px" className="aspect-[3/4]" />}
          </div>
        )}
      </section>
    )
  }

  if (variant === 'c') {
    return (
      // Mobile: a regular photo on top and the text below on white (flex-col-reverse), no big grey panel.
      // Desktop: one wide panel in the backdrop colour, text on the left, the model filling the right half.
      <section className="flex flex-col-reverse gap-6 lg:relative lg:block lg:overflow-hidden lg:rounded-card lg:bg-[#eaeaec]">
        {text('lg:relative lg:z-10 lg:max-w-[50%] lg:py-20 lg:pl-16 xl:max-w-[700px]')}
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

  return (
    <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-16">
      {text('lg:py-10')}
      {current && <Photo item={current} sizes="(max-width: 1024px) 100vw, 480px" className="aspect-[4/5]" />}
    </section>
  )
}
