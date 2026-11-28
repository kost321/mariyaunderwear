import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getPayload } from '@/lib/payload'
import { sendSms, smsText } from '@/lib/turbosms'
import type { CartItem, CheckoutForm } from '@/types/shop'
import { isSizeAvailable } from '@/lib/stock'
import { esc, notifyRecipients, str } from '@/lib/mail'
import { createRateLimiter } from '@/lib/rateLimit'
import { createIdempotencyCache, idempotencyKey } from '@/lib/idempotency'
import { isPaymentMethod, paymentMethodLabel } from '@/lib/payment'
import { normalizeUaPhone } from '@/lib/phone'
import { reportFailure } from '@/lib/sentry'
import { orderToken } from '@/lib/orderToken'
import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { routing, localePath, type Locale } from '@/i18n/routing'

const isRateLimited = createRateLimiter(5, 10 * 60 * 1000)

type OrderBody = { items?: CartItem[]; form?: Partial<CheckoutForm>; orderKey?: unknown; locale?: unknown }

/** A product fetched with locale: 'all': localized fields arrive as { uk, pl, en }. */
type LocalizedFields = {
  title?: Partial<Record<Locale, string | null>>
  colorName?: Partial<Record<Locale, string | null>>
}

/**
 * Language: the customer's errors and confirmation email are in the language of the site they ordered on
 * (body.locale); the order in the admin, the store's email and the SMS stay Ukrainian. The cart keeps the
 * title and colour in the language the customer browsed in, so the colour is mapped back to Ukrainian.
 */
const localeOf = (body: OrderBody | undefined): Locale =>
  hasLocale(routing.locales, body?.locale) ? body.locale : routing.defaultLocale

// One order per checkout attempt: the cart sends the same key with every retry (lib/idempotency). The order
// is saved before the emails and SMS go out, so a slow network can lose the answer of an order that went
// through; the retry then gets that order back instead of creating a second one.
const orders = createIdempotencyCache(30 * 60 * 1000)

export async function POST(req: NextRequest) {
  let body: OrderBody
  try {
    body = await req.json()
  } catch {
    const t = await getTranslations({ locale: routing.defaultLocale, namespace: 'Api' })
    return NextResponse.json({ error: t('invalid') }, { status: 400 })
  }

  const key = idempotencyKey(body?.orderKey)
  // A retry of an order that already went through: the same answer, and it does not count against the limit
  const done = await orders.done(key)
  if (done) return NextResponse.json(done.body, { status: done.status })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    const t = await getTranslations({ locale: localeOf(body), namespace: 'Api' })
    return NextResponse.json({ error: t('tooMany') }, { status: 429 })
  }

  const res = await orders.run(key, async () => {
    const answer = await placeOrder(body)
    return { status: answer.status, body: await answer.json() }
  })
  return NextResponse.json(res.body, { status: res.status })
}

/** Checks the cart against the DB, saves the order and sends the notifications. */
async function placeOrder(body: OrderBody): Promise<NextResponse> {
  const locale = localeOf(body)
  const t = await getTranslations({ locale, namespace: 'OrderApi' })
  const tApi = await getTranslations({ locale, namespace: 'Api' })
  const BAD_REQUEST = () => NextResponse.json({ error: tApi('invalid') }, { status: 400 })
  const rawItems = body?.items
  const rawForm = body?.form
  if (!Array.isArray(rawItems) || rawItems.length < 1 || rawItems.length > 50 || !rawForm) {
    return BAD_REQUEST()
  }

  const customerName = str(rawForm.customerName, 100)
  const phone = str(rawForm.phone, 30)
  const city = str(rawForm.city, 100)
  const novaPoshtaBranch = str(rawForm.novaPoshtaBranch, 100)
  const email = str(rawForm.email, 120)
  const comment = str(rawForm.comment, 1000)
  if (
    !customerName ||
    !phone ||
    city === undefined ||
    novaPoshtaBranch === undefined ||
    email === undefined ||
    comment === undefined
  ) {
    return BAD_REQUEST()
  }
  // Phone: only Ukrainian numbers, stored as +380XXXXXXXXX (lib/phone).
  const normalizedPhone = normalizeUaPhone(phone)
  if (!normalizedPhone) {
    const tPhone = await getTranslations({ locale, namespace: 'Phone' })
    return NextResponse.json({ error: tPhone('invalid') }, { status: 400 })
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return BAD_REQUEST()
  }
  // Payment method: chosen at checkout; the quick order sends none.
  const paymentMethod = rawForm.paymentMethod
  if (paymentMethod !== undefined && !isPaymentMethod(paymentMethod)) {
    return BAD_REQUEST()
  }
  const form: CheckoutForm = {
    customerName,
    phone: normalizedPhone,
    city,
    novaPoshtaBranch,
    email: email || undefined,
    comment,
    paymentMethod,
  }

  for (const item of rawItems) {
    if (
      !item ||
      str(item.size, 50) === undefined ||
      str(item.color, 50) === undefined
    ) {
      return BAD_REQUEST()
    }
  }

  const payload = await getPayload()

  // Price and title come from the DB, not from the cart: the client is trusted only
  // for productId, size, color and quantity.
  const ids = [...new Set(rawItems.map((item) => Number(item?.productId)))]
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    return BAD_REQUEST()
  }
  // Ukrainian values (the default locale) for the order; the same products in every language for
  // the colour mapping and the customer's own titles
  const [found, localized] = await Promise.all([
    payload.find({
      collection: 'products',
      where: { id: { in: ids }, active: { equals: true } },
      limit: ids.length,
      depth: 0,
      pagination: false,
    }),
    payload.find({
      collection: 'products',
      where: { id: { in: ids } },
      locale: 'all',
      limit: ids.length,
      depth: 0,
      pagination: false,
      select: { title: true, colorName: true },
    }),
  ])
  const productsById = new Map(found.docs.map((p) => [p.id, p]))
  const localizedById = new Map(localized.docs.map((p) => [p.id, p as unknown as LocalizedFields]))

  // How many units of each size are already in the order (one product can
  // appear in the cart several times with different colors).
  const requested = new Map<string, number>()

  const items: CartItem[] = []
  // Title and colour in the customer's language, for their email (same order as `items`)
  const customerTitles: string[] = []
  const customerColors: (string | undefined)[] = []
  for (const raw of rawItems) {
    const product = productsById.get(Number(raw.productId))
    const quantity = Number(raw.quantity)
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return NextResponse.json({ error: t('unavailable') }, { status: 400 })
    }
    const translations = localizedById.get(product.id)
    const ukTitle = product.title ?? ''
    // The title in the customer's language, for the messages shown to them
    const title = translations?.title?.[locale] || ukTitle
    // The colour as the customer saw it (any language) → the Ukrainian name of the card's colour
    const colorNames = Object.values(translations?.colorName ?? {}).filter(Boolean)
    const color = raw.color && colorNames.includes(raw.color) ? (product.colorName ?? raw.color) : raw.color

    // The size must exist on the product, be in stock (lib/stock: empty stock = not in stock)
    // and the quantity must not exceed the stock.
    const sizeRow = product.sizes?.find((s) => s.value === raw.size)
    if (!sizeRow || !isSizeAvailable(sizeRow)) {
      return NextResponse.json(
        { error: raw.size ? t('outOfStockSize', { title, size: raw.size }) : t('outOfStock', { title }) },
        { status: 400 },
      )
    }
    const key = `${product.id}:${sizeRow.value}`
    const total = (requested.get(key) ?? 0) + quantity
    requested.set(key, total)
    if (total > (sizeRow.stock ?? 0)) {
      return NextResponse.json(
        {
          error: t('notEnough', { title, size: sizeRow.value, stock: sizeRow.stock ?? 0 }),
        },
        { status: 400 },
      )
    }

    // The color must be one the product offers: the color card's own color
    // or one of the legacy colors array. Empty is allowed (products without colors).
    const productColors = [product.colorName, ...(product.colors ?? []).map((c) => c.name)].filter(Boolean)
    if (color && !productColors.includes(color)) {
      return NextResponse.json({ error: t('colorUnavailable', { title, color: raw.color ?? '' }) }, { status: 400 })
    }

    items.push({
      productId: String(product.id),
      title: ukTitle,
      price: product.price,
      slug: product.slug ?? '',
      size: raw.size,
      color,
      quantity,
    })
    customerTitles.push(title)
    customerColors.push(raw.color)
  }

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Save the order to the DB
  const order = await payload.create({
    collection: 'orders',
    data: {
      customerName: form.customerName,
      phone: form.phone,
      email: form.email,
      comment: [form.city, form.novaPoshtaBranch, form.comment].filter(Boolean).join(' | '),
      totalPrice,
      status: 'new',
      paymentMethod: form.paymentMethod,
      products: items.map((item) => ({
        product: Number(item.productId),
        titleSnapshot: item.title,
        priceSnapshot: item.price,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      })),
    },
  })

  // Link to the "order accepted" page (signed, see lib/orderToken): the cart opens it, the customer's email links to it
  const token = orderToken(order.id)
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL

  // Send the emails: the store's in Ukrainian, the customer's in the language of the site they ordered on
  const ukLabels = await getTranslations({ locale: 'uk', namespace: 'OrderEmail' })
  const customerLabels = await getTranslations({ locale, namespace: 'OrderEmail' })
  const paymentUk = await getTranslations({ locale: 'uk', namespace: 'Payment' })
  const paymentCustomer = await getTranslations({ locale, namespace: 'Payment' })

  const renderOrder = (
    l: typeof ukLabels,
    payment: typeof paymentUk,
    titles: string[],
    colors: (string | undefined)[],
  ) => {
    const itemsHtml = items
      .map(
        (item, i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${esc(titles[i] ?? item.title)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${esc(item.size ?? '—')}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${esc(colors[i] ?? item.color ?? '—')}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${l('amount', { value: item.price * item.quantity })}</td>
      </tr>`,
      )
      .join('')

    const orderTable = `
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <thead>
          <tr style="background:#f5f5f5">
            <th style="padding:8px;text-align:left">${l('product')}</th>
            <th style="padding:8px;text-align:left">${l('size')}</th>
            <th style="padding:8px;text-align:left">${l('color')}</th>
            <th style="padding:8px;text-align:center">${l('quantity')}</th>
            <th style="padding:8px;text-align:right">${l('sum')}</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="padding:8px;text-align:right"><b>${l('total')}</b></td>
            <td style="padding:8px;text-align:right"><b>${l('amount', { value: totalPrice })}</b></td>
          </tr>
        </tfoot>
      </table>
  `

    const details = `
      <p><b>${l('name')}</b> ${esc(form.customerName)}</p>
      <p><b>${l('phone')}</b> ${esc(form.phone)}</p>
      ${form.email ? `<p><b>${l('email')}</b> ${esc(form.email)}</p>` : ''}
      <p><b>${l('city')}</b> ${esc(form.city)}</p>
      <p><b>${l('branch')}</b> ${esc(form.novaPoshtaBranch)}</p>
      <p><b>${l('payment')}</b> ${form.paymentMethod ? esc(payment(`${form.paymentMethod}.label`)) : l('paymentLater')}</p>
      ${form.comment ? `<p><b>${l('comment')}</b> ${esc(form.comment)}</p>` : ''}
  `
    return details + orderTable
  }

  // The order is already saved: an email or SMS failure must not break the response to the customer
  // (otherwise they would retry and create a duplicate).
  const resend = new Resend(process.env.RESEND_API_KEY)
  const emails = [
    {
      // To the store
      to: notifyRecipients(),
      ...(form.email && { replyTo: form.email }),
      subject: `Нове замовлення #${order.id} — ${String(form.customerName).replace(/[\r\n]+/g, ' ')}`,
      html: `<h2>Нове замовлення #${order.id}</h2>${
        locale !== 'uk' ? `<p><b>Мова сайту:</b> ${locale.toUpperCase()}</p>` : ''
      }${renderOrder(
        ukLabels,
        paymentUk,
        items.map((item) => item.title),
        items.map((item) => item.color),
      )}`,
    },
    // Confirmation to the customer, a separate email so they do not see the store's notification addresses
    ...(form.email
      ? [
          {
            to: [form.email],
            replyTo: notifyRecipients()[0],
            subject: customerLabels('subject', { id: order.id }),
            html: `
      <h2>${customerLabels('thanks', { id: order.id })}</h2>
      <p>${form.paymentMethod === 'prepaid' ? customerLabels('prepaidText') : customerLabels('confirmText')}</p>
      ${renderOrder(customerLabels, paymentCustomer, customerTitles, customerColors)}
      ${siteUrl ? `<p style="margin-top:24px"><a href="${siteUrl}${localePath(locale)}/order/${token}">${customerLabels('viewOnSite')}</a></p>` : ''}
    `,
          },
        ]
      : []),
  ]
  await Promise.all([
    ...emails.map(async (email) => {
      try {
        const { error } = await resend.emails.send({ from: 'Mariya Underwear <orders@mariyaunderwear.com>', ...email })
        if (error) {
          console.error('[order] Resend відхилив лист:', order.id, email.subject, error)
          reportFailure('order-email', error)
        }
      } catch (err) {
        console.error('[order] Не вдалося надіслати лист:', order.id, email.subject, err)
        reportFailure('order-email', err)
      }
    }),
    // SMS to the customer right away; sendSms never throws (a failure is only logged).
    sendSms(form.phone, smsText.orderAccepted(order.id)),
  ])

  return NextResponse.json({ success: true, orderId: order.id, token })
}
