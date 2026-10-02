import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getPayload } from '@/lib/payload'
import type { CartItem, CheckoutForm } from '@/types/shop'

const resend = new Resend(process.env.RESEND_API_KEY)

/** Екранує текст від покупця перед вставкою в HTML листа. */
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: NextRequest) {
  const { items: rawItems, form }: { items: CartItem[]; form: CheckoutForm } = await req.json()

  if (!Array.isArray(rawItems) || !rawItems.length || !form?.customerName || !form?.phone) {
    return NextResponse.json({ error: 'Невірні дані' }, { status: 400 })
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

  await resend.emails.send({
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

  return NextResponse.json({ success: true, orderId: order.id })
}
