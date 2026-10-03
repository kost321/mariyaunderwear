import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getPayload } from '@/lib/payload'
import type { CartItem, CheckoutForm } from '@/types/shop'

// Limit on orders per IP address (kept in process memory, which is
// enough for a single Railway instance).
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 10 * 60 * 1000
const hits = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent)
    return true
  }
  recent.push(now)
  hits.set(ip, recent)
  // Do not let the map grow without bound.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(key)
    }
  }
  return false
}

/** A string with a length limit; undefined if the value is invalid. */
function str(value: unknown, max: number): string | undefined {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value !== 'string' || value.length > max) return undefined
  return value.trim()
}

/**
 * Recipients of the new-order email: ORDER_NOTIFY_EMAIL (one address or
 * several separated by commas). If the variable is unset, the owner's fallback address.
 */
function notifyRecipients(): string[] {
  const list = (process.env.ORDER_NOTIFY_EMAIL ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
  return list.length > 0 ? list : ['itsmariainthecity@gmail.com']
}

/** Escapes customer-supplied text before inserting it into the email HTML. */
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

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
  // Phone: 10-15 digits, other characters only as ordinary separators.
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15 || !/^[\d\s+()-]+$/.test(phone)) {
    return BAD_REQUEST()
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return BAD_REQUEST()
  }
  const form: CheckoutForm = {
    customerName,
    phone,
    city,
    novaPoshtaBranch,
    email: email || undefined,
    comment,
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

    // The size must exist on the product and the quantity must not exceed stock.
    // Empty stock = unknown (product added by hand), so no limit.
    if (product.sizes?.length) {
      const sizeRow = product.sizes.find((s) => s.value === raw.size)
      if (!sizeRow) {
        return NextResponse.json(
          { error: `Розміру немає в наявності: ${product.title}` },
          { status: 400 },
        )
      }
      const key = `${product.id}:${sizeRow.value}`
      const total = (requested.get(key) ?? 0) + quantity
      requested.set(key, total)
      if (typeof sizeRow.stock === 'number' && total > sizeRow.stock) {
        return NextResponse.json(
          {
            error: `Недостатньо в наявності: ${product.title}, розмір ${sizeRow.value} (залишилось ${sizeRow.stock} шт.)`,
          },
          { status: 400 },
        )
      }
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

  // Send the email
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

  // The order is already saved: an email failure must not break the response to the customer
  // (otherwise they would retry and create a duplicate).
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
    from: 'Mariya Underwear <orders@mariyaunderwear.com>',
    to: notifyRecipients(),
    subject: `Нове замовлення #${order.id} — ${String(form.customerName).replace(/[\r\n]+/g, ' ')}`,
    html: `
      <h2>Нове замовлення #${order.id}</h2>
      <p><b>Ім'я:</b> ${esc(form.customerName)}</p>
      <p><b>Телефон:</b> ${esc(form.phone)}</p>
      <p><b>Місто:</b> ${esc(form.city)}</p>
      <p><b>Відділення НП:</b> ${esc(form.novaPoshtaBranch)}</p>
      ${form.comment ? `<p><b>Коментар:</b> ${esc(form.comment)}</p>` : ''}
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
    `,
    })
    if (error) console.error('[order] Resend відхилив лист:', order.id, error)
  } catch (err) {
    console.error('[order] Не вдалося надіслати лист:', order.id, err)
  }

  return NextResponse.json({ success: true, orderId: order.id })
}
