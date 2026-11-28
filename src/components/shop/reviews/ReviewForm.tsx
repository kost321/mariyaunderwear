'use client'

import { useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { FormField as Field } from '@/components/shop/FormField'
import { focusFirstInvalid } from '@/lib/formErrors'
import { FITS } from '@/lib/reviews'
import { cn } from '@/lib/utils'

const EMPTY = { name: '', text: '', fit: '', website: '' }
type Errors = { rating?: string; name?: string; text?: string }

const STAR = 'M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z'

/**
 * "Залишити відгук" on the product page: sent to /api/review, published after the owner checks it.
 * Kept short on purpose: stars, name, text and one optional tap on how the size fit.
 */
export function ReviewForm({ productId }: { productId: number }) {
  const t = useTranslations('ReviewForm')
  const tFit = useTranslations('Reviews.fit')
  const tField = useTranslations('Fields')
  const locale = useLocale()
  // Words for 1–5 stars: ReviewForm.rating1…rating5
  const ratingWord = (n: number) => t(`rating${n as 1 | 2 | 3 | 4 | 5}`)
  const [form, setForm] = useState(EMPTY)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const formRef = useRef<HTMLFormElement>(null)

  function set(name: keyof typeof EMPTY, value: string) {
    setErrors((prev) => (name in prev ? { ...prev, [name]: undefined } : prev))
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const messages: Errors = {
      rating: rating ? undefined : t('ratingError'),
      name: form.name.trim() ? undefined : tField('firstName'),
      text: form.text.trim().length >= 3 ? undefined : t('textError'),
    }
    setErrors(messages)
    if (messages.rating || messages.name || messages.text) {
      focusFirstInvalid(formRef.current)
      return
    }
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, productId, rating, locale }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(res.status === 400 || res.status === 429 ? data?.error : '')
      }
      setStatus('sent')
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t('error'))
      setStatus('idle')
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" className="rounded-card bg-[#f4efeb] p-8 text-center">
        <p className="font-serif text-2xl text-ink-text">{t('thanks')}</p>
        <p className="mt-2 text-base leading-7 text-brown">{t('thanksText')}</p>
      </div>
    )
  }

  const shown = hover || rating

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="grid max-w-[560px] gap-5">
      {/* Rating: five radio buttons drawn as stars, arrows move between them */}
      <fieldset>
        <legend className="mb-1.5 text-sm text-brown">
          {t('rating')} <span className="text-ink" aria-hidden>*</span>
        </legend>
        <div className="flex items-center gap-3">
          <div className="flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer p-1" onMouseEnter={() => setHover(n)}>
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  checked={rating === n}
                  onChange={() => {
                    setRating(n)
                    setErrors((prev) => ({ ...prev, rating: undefined }))
                  }}
                  aria-label={t('ratingLabel', { n, word: ratingWord(n) })}
                  aria-invalid={errors.rating && n === 1 ? true : undefined}
                  className="peer sr-only"
                />
                <svg width="30" height="30" viewBox="0 0 20 20" aria-hidden className="rounded peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ink">
                  <path d={STAR} fill={n <= shown ? '#403834' : 'none'} stroke="#6e5c4d" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
              </label>
            ))}
          </div>
          {shown > 0 && <span className="text-sm text-brown">{ratingWord(shown)}</span>}
        </div>
        {errors.rating && (
          <p role="alert" className="mt-1.5 text-xs leading-5 text-destructive">
            {errors.rating}
          </p>
        )}
      </fieldset>

      <Field
        name="name"
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        label={t('name')}
        required
        autoComplete="given-name"
        maxLength={60}
        error={errors.name}
      />

      <div>
        <label htmlFor="review-text" className="mb-1.5 block text-sm text-brown">
          {t('text')} <span className="text-ink" aria-hidden>*</span>
        </label>
        <div
          className={cn(
            'rounded-[20px] border border-brown/30 bg-white p-1.5 focus-within:border-ink',
            errors.text && 'border-destructive focus-within:border-destructive',
          )}
        >
          <textarea
            id="review-text"
            value={form.text}
            onChange={(e) => set('text', e.target.value)}
            rows={4}
            maxLength={2000}
            required
            aria-invalid={errors.text ? true : undefined}
            aria-describedby={errors.text ? 'review-text-error' : undefined}
            placeholder={t('textPlaceholder')}
            className="block w-full resize-y bg-transparent px-3.5 py-1.5 text-sm leading-6 text-ink placeholder:text-brown/50 focus:outline-none"
          />
        </div>
        {errors.text && (
          <p id="review-text-error" role="alert" className="mt-1.5 px-5 text-xs leading-5 text-destructive">
            {errors.text}
          </p>
        )}
      </div>

      {/* One optional tap: for lingerie "how did the size fit" is what the next buyer reads first */}
      <fieldset>
        <legend className="mb-1.5 text-sm text-brown">{t('fit')}</legend>
        <div className="flex flex-wrap gap-2">
          {FITS.map((value) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="fit"
                value={value}
                checked={form.fit === value}
                onChange={() => set('fit', value)}
                // A second click on the chosen answer clears it: the question is optional
                onClick={() => form.fit === value && set('fit', '')}
                className="peer sr-only"
              />
              <span className="flex h-9 items-center rounded-full border border-brown/30 bg-white px-4 text-sm text-ink transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">
                {tFit(value)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Honeypot: hidden from people and screen readers, bots fill it in */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} />
        </label>
      </div>

      <div>
        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={status === 'sending'}
          className="flex h-11 w-full items-center justify-center rounded-card bg-ink px-7 text-base text-white transition-colors hover:bg-ink/90 disabled:opacity-60 sm:w-[265px]"
        >
          {status === 'sending' ? t('sending') : t('submit')}
        </button>
        <p className="mt-3 text-xs leading-5 text-brown">
          {t.rich('consent', {
            link: (chunks) => (
              <Link href="/privacy" className="text-ink underline underline-offset-2 hover:no-underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </form>
  )
}
