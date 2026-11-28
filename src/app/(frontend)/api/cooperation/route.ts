import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { esc, notifyRecipients, str } from '@/lib/mail'
import { createRateLimiter } from '@/lib/rateLimit'
import { reportFailure } from '@/lib/sentry'
import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'

// Limit on cooperation requests per IP address
const isRateLimited = createRateLimiter(3, 10 * 60 * 1000)

/**
 * Request from the "Співпраця" page form: sent to the owner by email, not stored in the DB.
 * Errors are in the visitor's language (body.locale); the email to the owner is Ukrainian.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {}
  let parsed = true
  try {
    body = await req.json()
  } catch {
    parsed = false
  }
  const locale = hasLocale(routing.locales, body?.locale) ? body.locale : routing.defaultLocale
  const t = await getTranslations({ locale, namespace: 'Api' })
  const BAD_REQUEST = () => NextResponse.json({ error: t('invalid') }, { status: 400 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: t('tooMany') }, { status: 429 })
  }
  if (!parsed) return BAD_REQUEST()

  const firstName = str(body?.firstName, 100)
  const lastName = str(body?.lastName, 100)
  const email = str(body?.email, 120)
  const company = str(body?.company, 200)
  const message = str(body?.message, 2000)
  const phone = str(body?.phone, 30)
  if (!firstName || !email || lastName === undefined || company === undefined || message === undefined || phone === undefined) {
    return BAD_REQUEST()
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return BAD_REQUEST()
  if (phone) {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 15 || !/^[\d\s+()-]+$/.test(phone)) return BAD_REQUEST()
  }

  const name = `${firstName} ${lastName}`.trim()
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: 'Mariya Underwear <orders@mariyaunderwear.com>',
      to: notifyRecipients(),
      replyTo: email,
      subject: `Співпраця — ${name.replace(/[\r\n]+/g, ' ')}${company ? `, ${company.replace(/[\r\n]+/g, ' ')}` : ''}`,
      html: `
        <h2>Нова заявка на співпрацю</h2>
        <p><b>Ім'я:</b> ${esc(name)}</p>
        <p><b>Email:</b> ${esc(email)}</p>
        ${phone ? `<p><b>Телефон:</b> ${esc(phone)}</p>` : ''}
        ${company ? `<p><b>Організація:</b> ${esc(company)}</p>` : ''}
        ${locale !== 'uk' ? `<p><b>Мова сайту:</b> ${locale.toUpperCase()}</p>` : ''}
        ${message ? `<p><b>Що цікавить:</b></p><p style="white-space:pre-wrap">${esc(message)}</p>` : ''}
      `,
    })
    if (error) {
      console.error('[cooperation] Resend відхилив лист:', error)
      reportFailure('cooperation-email', error)
      return NextResponse.json({ error: 'send failed' }, { status: 502 })
    }
  } catch (err) {
    console.error('[cooperation] Не вдалося надіслати лист:', err)
    reportFailure('cooperation-email', err)
    return NextResponse.json({ error: 'send failed' }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}
