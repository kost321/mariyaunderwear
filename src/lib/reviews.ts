import type { Review } from '@/payload-types'
import { colorLabel, modelName } from '@/lib/utils'

/** Labels of the "how did the size fit" choice; the same words in the form, the list and the summary. */
export const FIT_LABELS: Record<NonNullable<Review['fit']>, string> = {
  small: 'Маломірить',
  fits: 'В розмір',
  large: 'Великомірить',
}

export type ReviewSummary = {
  /** Reviews with a rating */
  rated: number
  /** Average rating, one decimal; null without rated reviews */
  average: number | null
  /** The fit answer most reviewers gave (more than half) and how many gave it; null without a majority */
  fit: { label: string; count: number; of: number } | null
}

export function summarizeReviews(reviews: Pick<Review, 'rating' | 'fit'>[]): ReviewSummary {
  const ratings = reviews.map((r) => r.rating).filter((r): r is number => typeof r === 'number' && r >= 1)
  const average = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null

  const fits = reviews.map((r) => r.fit).filter((f): f is NonNullable<Review['fit']> => Boolean(f))
  let fit: ReviewSummary['fit'] = null
  if (fits.length) {
    const counts = new Map<NonNullable<Review['fit']>, number>()
    for (const f of fits) counts.set(f, (counts.get(f) ?? 0) + 1)
    const [top, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
    // Only a clear majority: with "fits" and "large" at 1:1 either word would mislead
    if (count * 2 > fits.length) fit = { label: FIT_LABELS[top], count, of: fits.length }
  }
  return { rated: ratings.length, average, fit }
}

/** "1 відгук", "3 відгуки", "5 відгуків" */
export function reviewsCountLabel(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  const word = mod10 === 1 && mod100 !== 11 ? 'відгук' : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'відгуки' : 'відгуків'
  return `${n} ${word}`
}

/** "15 листопада 2026" (without the trailing "р." the browser adds) */
export function formatReviewDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Kyiv' })
    .replace(/\s*р\.$/, '')
}

/** What a review card needs: plain data, so it can be passed to client components. */
export type ReviewView = {
  id: number
  author: string
  rating: number | null
  text: string | null
  size: string | null
  fit: string | null
  date: string
  reply: string | null
  screenshot: { url: string; alt: string } | null
  link: string | null
  fromInstagram: boolean
  /** On the home page: which product the review is about (model name, colour, first photo) */
  product: { name: string; color: string | null; href: string; image: string | null } | null
}

export function toReviewView(review: Review, mediaUrl: (m: Review['screenshot']) => string | undefined): ReviewView {
  const product = typeof review.product === 'object' && review.product?.slug && review.product.active ? review.product : null
  const shot = mediaUrl(review.screenshot)
  return {
    id: review.id,
    author: review.authorName,
    rating: typeof review.rating === 'number' ? review.rating : null,
    text: review.text?.trim() || null,
    size: review.size?.trim() || null,
    fit: review.fit ? FIT_LABELS[review.fit] : null,
    date: formatReviewDate(review.createdAt),
    reply: review.reply?.trim() || null,
    screenshot: shot ? { url: shot, alt: `Відгук від ${review.authorName}` } : null,
    // Only real links to Instagram: the field is typed by hand
    link: review.link && /^https:\/\/(www\.)?instagram\.com\//.test(review.link.trim()) ? review.link.trim() : null,
    fromInstagram: review.source === 'instagram',
    product: product
      ? {
          name: modelName(product.title),
          color: product.colorName ? colorLabel(product.colorName) : null,
          href: `/product/${product.slug}`,
          image: mediaUrl(product.images?.[0]?.image) ?? null,
        }
      : null,
  }
}
