import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getPayload } from '@/lib/payload'
import { esc, notifyRecipients, str } from '@/lib/mail'
import { createRateLimiter } from '@/lib/rateLimit'
import { reportFailure } from '@/lib/sentry'
import { FIT_LABELS } from '@/lib/reviews'
import { SITE_URL } from '@/components/shop/JsonLd'

// Reviews per IP address: a customer rarely writes more than one or two at once
const isRateLimited = createRateLimiter(3, 10 * 60 * 1000)

const BAD_REQUEST = () => NextResponse.json({ error: 'Невірні дані' }, { status: 400 })

type Fit = keyof typeof FIT_LABELS
const isFit = (value: unknown): value is Fit => typeof value === 'string' && value in FIT_LABELS

/**
 * Review from the product page form. Saved as "pending" (not on the site until the owner publishes it
 * in the admin) and the owner gets an email with a link to it.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Забагато спроб. Спробуйте пізніше.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return BAD_REQUEST()
  }

  // Hidden field: people never see it, bots fill every input. Pretend it worked.
  if (typeof body?.website === 'string' && body.website.trim()) {
    return NextResponse.json({ success: true })
  }

  const productId = body?.productId
  const name = str(body?.name, 60)
  const text = str(body?.text, 2000)
  const rating = body?.rating
  const fit = body?.fit === '' || body?.fit === undefined ? null : body.fit
  if (
    typeof productId !== 'number' ||
    !Number.isInteger(productId) ||
    !name ||
    !text ||
    text.length < 3 ||
    typeof rating !== 'number' ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    (fit !== null && !isFit(fit))
  ) {
    return BAD_REQUEST()
  }

  const payload = await getPayload()
  const product = await payload
    .findByID({ collection: 'products', id: productId, depth: 0 })
    .catch(() => null)
  if (!product || !product.active) return BAD_REQUEST()

  let reviewId: number
  try {
    const review = await payload.create({
      collection: 'reviews',
      data: {
        status: 'pending',
        source: 'site',
        product: product.id,
        authorName: name,
        rating,
        text,
        fit,
      },
    })
    reviewId = review.id
  } catch (err) {
    console.error('[review] Не вдалося зберегти відгук:', err)
    reportFailure('review-save', err)
    return NextResponse.json({ error: 'save failed' }, { status: 500 })
  }

  // The review is already saved: a failed email is reported, but the customer still sees "thank you"
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: 'Mariya Underwear <orders@mariyaunderwear.com>',
      to: notifyRecipients(),
      subject: `Новий відгук ${'★'.repeat(rating)} — ${product.title.replace(/[\r\n]+/g, ' ')}`,
      html: `
        <h2>Новий відгук чекає на перевірку</h2>
        <p><b>Товар:</b> <a href="${SITE_URL}/product/${esc(product.slug)}">${esc(product.title)}</a></p>
        <p><b>Оцінка:</b> ${rating} з 5</p>
        <p><b>Імʼя:</b> ${esc(name)}</p>
        ${fit ? `<p><b>Як сів:</b> ${esc(FIT_LABELS[fit])}</p>` : ''}
        <p style="white-space:pre-wrap">${esc(text)}</p>
        <p><a href="${SITE_URL}/admin/collections/reviews/${reviewId}">Відкрити в адмінці й опублікувати</a></p>
      `,
    })
    if (error) reportFailure('review-email', error)
  } catch (err) {
    reportFailure('review-email', err)
  }

  return NextResponse.json({ success: true })
}
