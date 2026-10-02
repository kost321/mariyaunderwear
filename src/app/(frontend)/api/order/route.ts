import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getPayload } from '@/lib/payload'
import { sendSms } from '@/lib/turbosms'
import type { CartItem, CheckoutForm } from '@/types/shop'

// Ліміт замовлень з однієї IP-адреси (у пам'яті процесу — для одного
// інстансу Railway достатньо).
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
  // Не даємо мапі рости безмежно.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(key)
    }
  }
  return false
}

/** Рядок із обмеженням довжини; undefined, якщо значення невалідне. */
function str(value: unknown, max: number): string | undefined {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value !== 'string' || value.length > max) return undefined
  return value.trim()
}

/** Екранує текст від покупця перед вставкою в HTML листа. */
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
  // Телефон: 10–15 цифр, інші символи — лише звичайні роздільники.
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

  // Ціну й назву беремо з БД, а не з кошика: клієнту довіряємо лише
  // productId, розмір, колір і кількість.
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

  // Скільки штук кожного розміру вже в замовленні (одна позиція може
  // повторюватись у кошику з різним кольором).
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

    // Розмір має існувати у товару, а кількість не перевищувати залишок.
    // Порожній stock = залишок невідомий (товар додано вручну) — не обмежуємо.
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

  // Зберігаємо замовлення в БД
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

  // Відправляємо email
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

  // Замовлення вже збережене: збій листа не має ламати відповідь покупцю
  // (інакше він повторить замовлення й створить дубль).
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
    from: 'Mariya Underwear <orders@mariyaunderwear.com>',
    to: 'itsmariainthecity@gmail.com',
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

  // SMS покупцю одразу після підтвердження замовлення. sendSms не кидає
  // помилок (збій лише пишеться в лог) — замовлення вже збережене.
  await sendSms(form.phone, `Замовлення №${order.id} прийнято. Дякуємо! Mariya Underwear`)

  return NextResponse.json({ success: true, orderId: order.id })
}
