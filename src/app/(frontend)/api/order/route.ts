import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getPayload } from '@/lib/payload'
import type { CartItem, CheckoutForm } from '@/types/shop'
import { isSizeAvailable } from '@/lib/stock'
import { esc, notifyRecipients, str } from '@/lib/mail'
import { createRateLimiter } from '@/lib/rateLimit'
import { isPaymentMethod, paymentMethodLabel } from '@/lib/payment'
import { normalizeUaPhone } from '@/lib/phone'

const isRateLimited = createRateLimiter(5, 10 * 60 * 1000)

const BAD_REQUEST = () => NextResponse.json({ error: 'Невірні дані' }, { status: 400 })

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Забагато спроб. Спробуйте пізніше.' }, { status: 429 })
  }

  let body: { items?: CartItem[]; form?: Partial<CheckoutForm> }
  try {
    body = await req.json()
  } catch {
    return BAD_REQUEST()
  }

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
    return NextResponse.json(
      { error: 'Вкажіть український номер телефону, наприклад +380 67 123 45 67' },
      { status: 400 },
    )
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
    return NextResponse.json({ error: 'Невірні дані' }, { status: 400 })
  }
  const found = await payload.find({
    collection: 'products',
    where: { id: { in: ids }, active: { equals: true } },
    limit: ids.length,
    depth: 0,
    pagination: false,
  })
  const productsById = new Map(found.docs.map((p) => [p.id, p]))

  // How many units of each size are already in the order (one product can
  // appear in the cart several times with different colors).
  const requested = new Map<string, number>()

  const items: CartItem[] = []
  for (const raw of rawItems) {
    const product = productsById.get(Number(raw.productId))
    const quantity = Number(raw.quantity)
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return NextResponse.json(
        { error: 'Товар недоступний або невірна кількість' },
        { status: 400 },
      )
    }

    // The size must exist on the product, be in stock (lib/stock: empty stock = not in stock)
    // and the quantity must not exceed the stock.
    const sizeRow = product.sizes?.find((s) => s.value === raw.size)
    if (!sizeRow || !isSizeAvailable(sizeRow)) {
      return NextResponse.json(
        { error: `Немає в наявності: ${product.title}${raw.size ? `, розмір ${raw.size}` : ''}` },
        { status: 400 },
      )
    }
    const key = `${product.id}:${sizeRow.value}`
    const total = (requested.get(key) ?? 0) + quantity
    requested.set(key, total)
    if (total > (sizeRow.stock ?? 0)) {
      return NextResponse.json(
        {
          error: `Недостатньо в наявності: ${product.title}, розмір ${sizeRow.value} (залишилось ${sizeRow.stock} шт.)`,
        },
        { status: 400 },
      )
    }

    // The color must be one the product offers: the color card's own color
    // or one of the legacy colors array. Empty is allowed (products without colors).
    const productColors = [product.colorName, ...(product.colors ?? []).map((c) => c.name)].filter(Boolean)
    if (raw.color && !productColors.includes(raw.color)) {
      return NextResponse.json(
        { error: `Колір недоступний: ${product.title}, ${raw.color}` },
        { status: 400 },
      )
    }

    items.push({
      productId: String(product.id),
      title: product.title,
      price: product.price,
      slug: product.slug ?? '',
      size: raw.size,
      color: raw.color,
      quantity,
    })
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

  // Send the emails
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${esc(item.title)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${esc(item.size ?? '—')}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${esc(item.color ?? '—')}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${item.price * item.quantity} грн.</td>
      </tr>`,
    )
    .join('')

  const orderTable = `
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <thead>
          <tr style="background:#f5f5f5">
            <th style="padding:8px;text-align:left">Товар</th>
            <th style="padding:8px;text-align:left">Розмір</th>
            <th style="padding:8px;text-align:left">Колір</th>
            <th style="padding:8px;text-align:center">К-сть</th>
            <th style="padding:8px;text-align:right">Сума</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="padding:8px;text-align:right"><b>Разом:</b></td>
            <td style="padding:8px;text-align:right"><b>${totalPrice} грн.</b></td>
          </tr>
        </tfoot>
      </table>
  `

  const details = `
      <p><b>Ім'я:</b> ${esc(form.customerName)}</p>
      <p><b>Телефон:</b> ${esc(form.phone)}</p>
      ${form.email ? `<p><b>Email:</b> ${esc(form.email)}</p>` : ''}
      <p><b>Місто:</b> ${esc(form.city)}</p>
      <p><b>Відділення НП:</b> ${esc(form.novaPoshtaBranch)}</p>
      <p><b>Оплата:</b> ${form.paymentMethod ? esc(paymentMethodLabel(form.paymentMethod)) : 'уточнити під час дзвінка'}</p>
      ${form.comment ? `<p><b>Коментар:</b> ${esc(form.comment)}</p>` : ''}
  `

  // The order is already saved: an email failure must not break the response to the customer
  // (otherwise they would retry and create a duplicate).
  const resend = new Resend(process.env.RESEND_API_KEY)
  const emails = [
    {
      // To the store
      to: notifyRecipients(),
      ...(form.email && { replyTo: form.email }),
      subject: `Нове замовлення #${order.id} — ${String(form.customerName).replace(/[\r\n]+/g, ' ')}`,
      html: `<h2>Нове замовлення #${order.id}</h2>${details}${orderTable}`,
    },
    // Confirmation to the customer, a separate email so they do not see the store's notification addresses
    ...(form.email
      ? [
          {
            to: [form.email],
            replyTo: notifyRecipients()[0],
            subject: `Ваше замовлення #${order.id} — Mariya Underwear`,
            html: `
      <h2>Дякуємо за замовлення #${order.id}!</h2>
      <p>${
        form.paymentMethod === 'prepaid'
          ? 'Ми звʼяжемося з вами найближчим часом, щоб підтвердити замовлення. Реквізити для оплати надішлемо після підтвердження — будь ласка, не переказуйте кошти раніше.'
          : 'Ми звʼяжемося з вами найближчим часом, щоб підтвердити замовлення і спосіб оплати.'
      }</p>
      ${details}${orderTable}
    `,
          },
        ]
      : []),
  ]
  await Promise.all(
    emails.map(async (email) => {
      try {
        const { error } = await resend.emails.send({ from: 'Mariya Underwear <orders@mariyaunderwear.com>', ...email })
        if (error) console.error('[order] Resend відхилив лист:', order.id, email.subject, error)
      } catch (err) {
        console.error('[order] Не вдалося надіслати лист:', order.id, email.subject, err)
      }
    }),
  )

  return NextResponse.json({ success: true, orderId: order.id })
}
