'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { ReviewView } from '@/lib/reviews'
import { PhotoLightbox } from '@/components/shop/PhotoLightbox'
import { Stars } from './Stars'
import { cn } from '@/lib/utils'

/**
 * One review: author and stars, date, size and fit, text, screenshot (opens full screen), the shop's reply.
 * With `showProduct` (home page) the product sits in a footer pinned to the bottom, so cards of different
 * length in one row still end the same way instead of with an empty band.
 */
export function ReviewCard({
  review,
  showProduct,
  className,
}: {
  review: ReviewView
  showProduct?: boolean
  className?: string
}) {
  const t = useTranslations('Reviews')
  const [open, setOpen] = useState(false)
  const product = showProduct ? review.product : null

  return (
    <article className={cn('flex flex-col rounded-card bg-[#f4efeb] p-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate font-serif text-lg leading-6 text-ink-text">{review.author}</p>
        {review.rating && <Stars value={review.rating} size={15} className="mt-1 shrink-0" />}
      </div>
      <p className="mt-1 text-xs text-brown">
        {review.date}
        {review.fromInstagram && ` · ${t('fromInstagram')}`}
      </p>

      {(review.fit || review.size) && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {review.fit && <span className="rounded-full bg-white px-3 py-1 text-xs text-ink">{t(`fit.${review.fit}`)}</span>}
          {review.size && (
            <span className="rounded-full bg-white px-3 py-1 text-xs text-ink">{t('size', { size: review.size })}</span>
          )}
        </div>
      )}

      {review.screenshot && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('openScreenshot')}
          className="relative mt-4 aspect-[3/4] w-full overflow-hidden rounded-[18px] bg-white"
        >
          <Image
            src={review.screenshot.url}
            alt={review.screenshot.alt}
            fill
            sizes="(max-width: 640px) 70vw, 400px"
            className="object-cover object-top"
          />
        </button>
      )}

      {review.text && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-ink">{review.text}</p>}

      {review.reply && (
        <div className="mt-4 border-l-2 border-brown/30 pl-4">
          <p className="text-xs text-brown">{t('reply')}</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-ink">{review.reply}</p>
        </div>
      )}

      {review.link && (
        <a
          href={review.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-xs text-brown underline underline-offset-2 hover:text-ink"
        >
          {t('viewOnInstagram')}
        </a>
      )}

      {product && (
        // mt-auto pins the footer to the bottom; pt-6 keeps a gap above it on the longest card of the row
        <div className="mt-auto pt-6">
          <Link href={product.href} className="group flex items-center gap-3 border-t border-brown/15 pt-4">
            <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-xl bg-placeholder">
              {product.image && (
                <Image src={product.image} alt="" fill sizes="44px" className="object-cover object-top" />
              )}
            </span>
            <span className="min-w-0 text-sm leading-5">
              <span className="block truncate text-ink group-hover:underline group-hover:underline-offset-2">
                {product.name}
              </span>
              {product.color && <span className="block truncate text-xs text-brown">{product.color}</span>}
            </span>
          </Link>
        </div>
      )}

      {open && review.screenshot && (
        <PhotoLightbox photos={[review.screenshot]} index={0} onChange={() => {}} onClose={() => setOpen(false)} />
      )}
    </article>
  )
}
