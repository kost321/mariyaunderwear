import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { esc, notifyRecipients, str } from '@/lib/mail'
import { createRateLimiter } from '@/lib/rateLimit'

// Limit on cooperation requests per IP address
const isRateLimited = createRateLimiter(3, 10 * 60 * 1000)

const BAD_REQUEST = () => NextResponse.json({ error: 'Невірні дані' }, { status: 400 })

/** Request from the "Співпраця" page form: sent to the owner by email, not stored in the DB. */
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

  const firstName = str(body?.firstName, 100)
  const lastName = str(body?.lastName, 100)
  const email = str(body?.email, 120)
  const company = str(body?.company, 200)
  const position = str(body?.position, 100)
  const phone = str(body?.phone, 30)
  if (!firstName || !email || lastName === undefined || company === undefined || position === undefined || phone === undefined) {
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
        ${position ? `<p><b>Посада:</b> ${esc(position)}</p>` : ''}
      `,
    })
    if (error) {
      console.error('[cooperation] Resend відхилив лист:', error)
      return NextResponse.json({ error: 'send failed' }, { status: 502 })
    }
  } catch (err) {
    console.error('[cooperation] Не вдалося надіслати лист:', err)
    return NextResponse.json({ error: 'send failed' }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}
