import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check } from 'lucide-react'
import type { Order, Product } from '@/payload-types'
import { getPayload } from '@/lib/payload'
import { readOrderToken } from '@/lib/orderToken'
import { getMediaUrl } from '@/lib/media'
import { formatUaPhoneInput } from '@/lib/phone'
import { isPaymentMethod, paymentMethodLabel } from '@/lib/payment'
import { CONTACTS } from '@/lib/contacts'
import { cn, colorLabel, formatPrice, shortProductTitle } from '@/lib/utils'
import { OrderTotals } from '@/components/shop/OrderTotals'
import { primaryButton, secondaryButton } from '@/components/shop/StatusScreen'

export const metadata: Metadata = {
  title: 'Замовлення прийнято',
  // A personal page: not for search engines, and its address (the token) is not passed on to other sites
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ token: string }> }

/**
 * Checkout orders keep the delivery in `comment` as "city | branch | customer comment" (api/order: the
 * collection has no delivery fields yet, they come with the Nova Poshta integration). Quick orders have no
 * payment method and no address, their comment is the customer's own.
 */
function splitComment(order: Order) {
  if (!order.paymentMethod) return { delivery: null, comment: order.comment || null }
  const [city, branch, ...rest] = (order.comment ?? '').split(' | ')
  return {
    delivery: city && branch ? `Нова пошта, ${city}, відділення ${branch}` : null,
    comment: rest.join(' | ') || null,
  }
}

/**
 * "Order accepted" page: the cart opens it after a successful order, the customer's email links to it.
 * Reached only through a signed token (lib/orderToken), so order numbers cannot be walked through; a reload
 * just shows the saved order again, nothing is sent.
 */
export default async function OrderPage({ params }: Params) {
  const { token } = await params
  const id = readOrderToken(token)
  if (!id) notFound()

  const payload = await getPayload()
  const order = await payload.findByID({ collection: 'orders', id, depth: 2 }).catch(() => null)
  if (!order) notFound()

  const { delivery, comment } = splitComment(order)
  const payment = isPaymentMethod(order.paymentMethod) ? order.paymentMethod : null
  const lines = order.products ?? []
  const count = lines.reduce((sum, line) => sum + (line.quantity ?? 1), 0)

  const details = [
    { label: 'Отримувач', value: order.customerName },
    { label: 'Телефон', value: formatUaPhoneInput(order.phone) },
    { label: 'Email', value: order.email },
    { label: 'Доставка', value: delivery },
    { label: 'Оплата', value: payment ? paymentMethodLabel(payment) : 'уточнимо під час дзвінка' },
    { label: 'Коментар', value: comment },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value))

  return (
    <div className="pb-6">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4efeb] text-ink">
        <Check className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      </span>
      <h1 className="heading-page mt-5">Дякуємо за замовлення</h1>
      <p className="mt-3 text-xl font-medium text-ink">Замовлення №{order.id} прийнято</p>
      <div className="mt-3 max-w-[60ch] space-y-2 text-base leading-7 text-brown">
        <p>Менеджер зателефонує найближчим часом, щоб підтвердити замовлення{payment ? '' : ' і спосіб оплати'}.</p>
        {payment === 'prepaid' && (
          <p>Реквізити для оплати надішлемо після підтвердження. Будь ласка, не переказуйте кошти раніше.</p>
        )}
        {order.email && <p>Підтвердження з деталями замовлення прийде на {order.email}.</p>}
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/catalog" className={primaryButton}>
          Продовжити покупки
        </Link>
        <a href={CONTACTS.instagram} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
          Ми в Instagram
        </a>
      </div>

      <div className="mt-12 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-16">
        <section aria-labelledby="order-items">
          <h2 id="order-items" className="text-lg font-medium text-ink">
            Склад замовлення <span className="text-brown/60">({count})</span>
          </h2>
          <ul className="mt-4 divide-y divide-brown/15 border-y border-brown/15">
            {lines.map((line, i) => {
              const product = typeof line.product === 'object' ? (line.product as Product) : null
              const image = getMediaUrl(product?.images?.[0]?.image)
              const fullTitle = line.titleSnapshot ?? ''
              const title = shortProductTitle(fullTitle)
              const quantity = line.quantity ?? 1
              const variant = [line.color && colorLabel(line.color), line.size, `${quantity} шт.`].filter(Boolean).join(' · ')
              const photo = (
                <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-2xl bg-placeholder/40 sm:w-24">
                  {image && <Image src={image} alt={fullTitle} fill quality={90} sizes="96px" className="object-cover" />}
                </div>
              )
              return (
                <li key={line.id ?? i} className="flex gap-4 py-4 sm:gap-5">
                  {product?.slug ? <Link href={`/product/${product.slug}`}>{photo}</Link> : photo}
                  <div className="flex min-w-0 flex-1 flex-col justify-center sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="text-[15px] leading-6 text-ink">{title}</p>
                      <p className="mt-1 text-sm text-brown">{variant}</p>
                    </div>
                    <p className="mt-2 shrink-0 text-[15px] font-medium tabular-nums text-ink sm:mt-0">
                      {formatPrice((line.priceSnapshot ?? 0) * quantity)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <aside className="mt-10 rounded-card bg-[#f4efeb] px-6 py-6 lg:sticky lg:top-8 lg:mt-0 lg:px-8 lg:py-7">
          <h2 className="text-lg font-medium text-ink">Деталі</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {details.map((row) => (
              <div key={row.label} className="flex gap-4">
                <dt className="w-24 shrink-0 text-brown">{row.label}</dt>
                <dd className={cn('min-w-0 flex-1 text-ink', row.label === 'Email' && 'break-all')}>{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 border-t border-brown/15 pt-5">
            <OrderTotals total={order.totalPrice ?? 0} />
          </div>
        </aside>
      </div>
    </div>
  )
}
