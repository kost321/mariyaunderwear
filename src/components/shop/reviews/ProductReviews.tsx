'use client'

import { useState } from 'react'
import type { ReviewSummary, ReviewView } from '@/lib/reviews'
import { useLocale, useTranslations } from 'next-intl'
import { ReviewCard } from './ReviewCard'
import { ReviewForm } from './ReviewForm'
import { Stars } from './Stars'

// One desktop row; on phones three cards are already a long scroll
const PAGE = 3

/** "Відгуки" section of the product page: summary, the list (3 at a time) and the form, opened on demand. */
export function ProductReviews({
  reviews,
  summary,
  productId,
}: {
  reviews: ReviewView[]
  summary: ReviewSummary
  productId: number
}) {
  const t = useTranslations('Reviews')
  const locale = useLocale()
  const [shown, setShown] = useState(PAGE)
  // Closed until asked for: an open form would push "З цим товаром часто купують" far down the page
  const [formOpen, setFormOpen] = useState(false)

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="mt-16 scroll-mt-8 lg:mt-[100px]">
      <div className="flex flex-col gap-4 border-b border-brown/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="reviews-title" className="font-serif text-[28px] leading-9 text-ink-text">
            {t('title')}
            {reviews.length > 0 && <span className="ml-2 font-sans text-base text-brown">({reviews.length})</span>}
          </h2>
          {(summary.average || summary.fit) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brown">
              {summary.average && (
                <span className="flex items-center gap-2">
                  <Stars value={summary.average} />
                  <span className="text-ink">{locale === 'en' ? String(summary.average) : String(summary.average).replace('.', ',')}</span>
                </span>
              )}
              {summary.fit && (
                <span>
                  {t('fitSummary', {
                    fit: t(`fit.${summary.fit.fit}`).toLowerCase(),
                    count: summary.fit.count,
                    of: summary.fit.of,
                  })}
                </span>
              )}
            </div>
          )}
        </div>
        {!formOpen && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="flex h-11 shrink-0 items-center justify-center rounded-card border border-ink px-7 text-sm text-ink transition-colors hover:bg-ink hover:text-white"
          >
            {t('write')}
          </button>
        )}
      </div>

      {formOpen && (
        <div className="mt-8">
          <ReviewForm productId={productId} />
        </div>
      )}

      {reviews.length === 0 && !formOpen && (
        <p className="mt-6 text-base leading-7 text-brown">{t('empty')}</p>
      )}

      {reviews.length > 0 && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-[27px]">
            {reviews.slice(0, shown).map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
          {reviews.length > shown && (
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              className="mx-auto mt-8 flex h-11 items-center justify-center rounded-card border border-brown/30 px-7 text-sm text-ink transition-colors hover:border-ink"
            >
              {t('showMore', { count: Math.min(PAGE, reviews.length - shown) })}
            </button>
          )}
        </>
      )}
    </section>
  )
}
