import type { ReviewView } from '@/lib/reviews'
import { CONTACTS } from '@/lib/contacts'
import { ReviewCard } from '@/components/shop/reviews/ReviewCard'
import { ProductSlider } from './ProductSlider'

/**
 * "Відгуки" on the home page, right after "Новинки": published reviews (those ticked for the home page
 * first), three to a row, and a link to the pinned «Відгуки» stories in Instagram.
 * Three fill a desktop row exactly (no arrows); on phones the cards scroll sideways like "Новинки"
 * instead of a long column.
 * Until there are reviews in the admin, only the heading and the Instagram link are shown.
 */
export function HomeReviews({ reviews }: { reviews: ReviewView[] }) {
  const instagram = CONTACTS.instagramReviews && (
    <a
      href={CONTACTS.instagramReviews}
      target="_blank"
      rel="noopener noreferrer"
      className="relative shrink-0 text-base text-brown underline-offset-4 transition-colors before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-[''] hover:text-ink hover:underline"
    >
      Більше відгуків в Instagram →
    </a>
  )

  if (reviews.length === 0) {
    if (!instagram) return null
    return (
      <section
        aria-labelledby="home-reviews"
        className="flex flex-col items-center gap-4 rounded-card bg-[#f4efeb] px-6 py-10 text-center"
      >
        <h2 id="home-reviews" className="heading-section">
          Відгуки
        </h2>
        <p className="max-w-[520px] text-base leading-7 text-brown">
          Що кажуть наші покупчині про тканини, посадку й доставку — у закріплених сторіс.
        </p>
        {instagram}
      </section>
    )
  }

  const cards = reviews.map((r) => <ReviewCard key={r.id} review={r} showProduct />)

  return (
    <section aria-labelledby="home-reviews">
      {/* Same heading row as "Новинки": the link on the heading's baseline */}
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 lg:mb-10">
        <h2 id="home-reviews" className="heading-section">
          Відгуки
        </h2>
        {instagram}
      </div>
      <ProductSlider perView={3}>{cards}</ProductSlider>
    </section>
  )
}
