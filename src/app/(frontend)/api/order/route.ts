import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getPayload } from '@/lib/payload'
import type { CartItem, CheckoutForm } from '@/types/shop'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { items, form }: { items: CartItem[]; form: CheckoutForm } = await req.json()

  if (!items?.length || !form?.customerName || !form?.phone) {
    return NextResponse.json({ error: 'Невірні дані' }, { status: 400 })
  }

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Зберігаємо замовлення в БД
  const payload = await getPayload()
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
        <td style="padding:8px;border-bottom:1px solid #eee">${item.title}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.size ?? '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.color ?? '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${item.price * item.quantity} грн.</td>
      </tr>`,
    )
    .join('')

  await resend.emails.send({
    from: 'Mariya Underwear <orders@mariyaunderwear.com>',
    to: 'itsmariainthecity@gmail.com',
    subject: `Нове замовлення #${order.id} — ${form.customerName}`,
    html: `
      <h2>Нове замовлення #${order.id}</h2>
      <p><b>Ім'я:</b> ${form.customerName}</p>
      <p><b>Телефон:</b> ${form.phone}</p>
      <p><b>Місто:</b> ${form.city}</p>
      <p><b>Відділення НП:</b> ${form.novaPoshtaBranch}</p>
      ${form.comment ? `<p><b>Коментар:</b> ${form.comment}</p>` : ''}
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
