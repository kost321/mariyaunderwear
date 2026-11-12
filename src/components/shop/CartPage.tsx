'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Check, ShoppingBag, X } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { cn, colorLabel, formatPrice, shortProductTitle } from '@/lib/utils'
import { Breadcrumbs } from '@/components/shop/Breadcrumbs'
import { QuantityStepper } from '@/components/shop/QuantityStepper'
import { primaryButton } from '@/components/shop/StatusScreen'
import type { CartItem, CheckoutForm } from '@/types/shop'
import { PAYMENT_METHODS, paymentMethodLabel, type PaymentMethod } from '@/lib/payment'
import { normalizeUaPhone, PHONE_ERROR } from '@/lib/phone'

type Step = 'cart' | 'checkout' | 'success'

// Checkout tabs from the design: Information → Shipping → Payment
const CHECKOUT_STEPS = [
  { id: 'info', label: 'Інформація' },
  { id: 'shipping', label: 'Доставка' },
  { id: 'payment', label: 'Оплата' },
] as const
type CheckoutStep = (typeof CHECKOUT_STEPS)[number]['id']

const photo = 'relative overflow-hidden rounded-card bg-placeholder/40'
const field =
  'h-11 w-full border border-[#b6ada3] px-5 text-xs text-ink placeholder:text-brown/50 focus:border-ink focus:outline-none'

/** Empty cart: what happened and the way back to the catalog, instead of a blank page. */
function EmptyCart() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <ShoppingBag className="h-12 w-12 text-sand" strokeWidth={1} aria-hidden />
      <h1 className="heading-page mt-5">Кошик порожній</h1>
      <p className="mt-4 max-w-[420px] text-balance text-base leading-7 text-brown">
        Перегляньте каталог і додайте те, що сподобалося: товари збережуться тут до оформлення.
      </p>
      <Link href="/catalog" className={cn(primaryButton, 'mt-8')}>
        До каталогу
      </Link>
    </div>
  )
}

/** "Чайна роза · M": colour in sentence case and the size, as on the catalog cards. */
const variantLine = (item: CartItem) => [item.color && colorLabel(item.color), item.size].filter(Boolean).join(' · ')

/** "Next" button with an arrow, like "Shipping →" in the design. */
function NextButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <div className="mt-6 flex justify-end">
      <button
        type="submit"
        disabled={disabled}
        className="flex h-11 w-full items-center justify-between rounded-card bg-cream/70 px-6 text-sm text-ink transition-colors hover:bg-cream disabled:opacity-60 sm:w-[231px]"
      >
        {children}
        <Image src="/brand/arrow-long.svg" alt="" width={49} height={14} className="-scale-x-100" />
      </button>
    </div>
  )
}

/** "Summary" block: subtotal, delivery, total. Amounts in the body font; the total larger and bolder. */
function Totals({ total }: { total: number }) {
  return (
    <>
      <dl className="space-y-2 text-sm text-brown">
        <div className="flex justify-between gap-4">
          <dt>Сума</dt>
          <dd className="tabular-nums text-ink">{formatPrice(total)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Доставка</dt>
          <dd className="text-right">за тарифами Нової пошти</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-brown/15 pt-4 text-ink">
        <span className="text-base font-medium">Разом</span>
        <span className="text-xl font-semibold tabular-nums">{formatPrice(total)}</span>
      </div>
    </>
  )
}

/** Order line, as in "Your order" of the design: photo, title, color/size, quantity and amount. */
function OrderLine({ item, onChange }: { item: CartItem; onChange?: () => void }) {
  return (
    <div className="flex gap-[11px]">
      <div className={cn(photo, 'h-[134px] w-[113px] shrink-0')}>
        {item.image && <Image src={item.image} alt={item.title} fill quality={90} sizes="113px" className="object-cover" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-black">{item.title}</p>
          {onChange && (
            <button type="button" onClick={onChange} className="shrink-0 text-xs text-brown underline underline-offset-2">
              Змінити
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-brown">{[item.color, item.size].filter(Boolean).join(' / ')}</p>
        <div className="mt-auto flex items-baseline justify-between">
          <span className="text-xs text-brown/80">× {item.quantity}</span>
          <span className="text-[13px] text-brown/50">{formatPrice(item.price * item.quantity)}</span>
        </div>
      </div>
    </div>
  )
}

/** What is left on screen after the order: the cart itself is already cleared. */
type PlacedOrder = {
  id: number | string
  items: CartItem[]
  total: number
  address: string
  phone: string
  paymentMethod?: PaymentMethod
}

/** Ordered items in one row; scrolls sideways with a fade and a "›" button while there is more on the right. */
function OrderItemsRow({ items }: { items: CartItem[] }) {
  const listRef = useRef<HTMLUListElement>(null)
  const [more, setMore] = useState(false)

  const update = useCallback(() => {
    const el = listRef.current
    if (el) setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  return (
    <div className="relative min-w-0 lg:border-r lg:border-[#dfdfdf]">
      <ul
        ref={listRef}
        onScroll={update}
        className="flex snap-x gap-10 overflow-x-auto pb-2 [scrollbar-width:none] lg:pt-[29px] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <li key={`${item.productId}-${item.size}-${item.color}`} className="w-[260px] shrink-0 snap-start">
            <OrderLine item={item} />
          </li>
        ))}
      </ul>

      {more && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[133px] bg-gradient-to-r from-white/0 to-white" />
          <button
            type="button"
            onClick={() => listRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
            aria-label="Показати інші товари"
            className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center lg:right-6 lg:top-[calc(50%+14px)]"
          >
            <Image src="/brand/chevron.svg" alt="" width={13} height={7} className="rotate-90" />
          </button>
        </>
      )}
    </div>
  )
}

/** Thank-you screen: message + full-width band with the order lines and the summary. */
function OrderSuccess({ order }: { order: PlacedOrder }) {
  return (
    <div className="lg:pt-[110px]">
      <div className="flex flex-col items-center px-5 py-8 text-center lg:p-0">
        <h1 className="font-serif text-2xl uppercase leading-8 tracking-[2px] text-ink lg:text-[32px] lg:leading-10">Дякуємо за замовлення</h1>
        <Link href="/catalog" className="mt-2 leading-10 text-brown underline underline-offset-4 transition-colors hover:text-ink lg:mt-[17px]">
          Повернутись до покупок
        </Link>
      </div>

      <section className="-mx-[var(--gutter)] mt-6 grid border-y border-[#d9d9d9] px-[var(--gutter)] py-10 lg:mt-[66px] lg:grid-cols-[1fr_327px] lg:gap-x-[38px] lg:pb-[39px] lg:pr-[57px] lg:pt-[41px]">
        <OrderItemsRow items={order.items} />

        <div className="mt-10 flex flex-col border-t border-[#dfdfdf] pt-6 lg:mt-0 lg:min-h-[191px] lg:border-t-0 lg:pt-0">
          <dl className="space-y-2.5 text-xs text-ink">
            <div className="flex items-baseline justify-between gap-4">
              <dt>Номер замовлення</dt>
              <dd className="text-[13px] text-brown/50">№{order.id}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="shrink-0">Адреса доставки</dt>
              <dd className="text-right text-[10px] text-brown/50">{order.address}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="shrink-0">Контактний номер</dt>
              <dd className="text-right text-[10px] text-brown/50">{order.phone}</dd>
            </div>
            {order.paymentMethod && (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="shrink-0">Оплата</dt>
                <dd className="text-right text-[10px] text-brown/50">{paymentMethodLabel(order.paymentMethod)}</dd>
              </div>
            )}
          </dl>
          <div className="mt-10 flex items-baseline justify-between border-t border-[#dfdfdf] pt-4 font-serif text-sm text-ink lg:mt-auto">
            <span>Сума</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </section>
    </div>
  )
}

/**
 * Cart line: a small photo on the left; title, colour · size, the quantity capsule (same as on the product
 * page), the amount and remove on the right. Several products stay readable as a list.
 */
function BagItem({
  item,
  onRemove,
  onQuantity,
}: {
  item: CartItem
  onRemove: () => void
  onQuantity: (q: number) => void
}) {
  const title = shortProductTitle(item.title)
  return (
    <li className="flex gap-4 py-5 sm:gap-5">
      <Link href={`/product/${item.slug}`} className={cn(photo, 'aspect-[4/5] w-24 shrink-0 rounded-2xl sm:w-28')}>
        {item.image && <Image src={item.image} alt={item.title} fill quality={90} sizes="112px" className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/product/${item.slug}`} className="text-[15px] leading-6 text-ink underline-offset-4 hover:underline">
              {title}
            </Link>
            <p className="mt-1 text-sm text-brown">{variantLine(item)}</p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Прибрати з кошика: ${title}`}
            className="-mr-2 -mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brown transition-colors [@media(hover:hover)]:hover:bg-cream [@media(hover:hover)]:hover:text-ink"
          >
            <X className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <QuantityStepper value={item.quantity} onChange={onQuantity} label={`Кількість: ${title}`} />
          <div className="text-right">
            <p className="text-[15px] font-medium tabular-nums text-ink">{formatPrice(item.price * item.quantity)}</p>
            {item.quantity > 1 && <p className="text-xs tabular-nums text-brown">{formatPrice(item.price)} за шт.</p>}
          </div>
        </div>
      </div>
    </li>
  )
}

/** How long "Товар видалено · Повернути" stays on screen */
const UNDO_MS = 5000

/** Short note at the bottom of the screen after a line is removed, with a way to put it back. */
function RemovedToast({ onUndo, onClose }: { onUndo: () => void; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, UNDO_MS)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    // Pinned to the very bottom (above the iPhone home bar), so on phones it covers as little as possible.
    // Light with a border and a shadow: readable over the white page, the beige summary and the dark footer.
    // The strip itself lets clicks through, only the toast catches them.
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-50 flex justify-center px-4 lg:bottom-6"
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-brown/15 bg-white py-1.5 pl-5 pr-1.5 text-sm text-ink shadow-[0_8px_24px_rgba(64,54,51,0.18)]">
        <span>Товар видалено</span>
        <button
          type="button"
          onClick={onUndo}
          className="rounded-full px-3 py-1.5 font-medium underline underline-offset-4 transition-colors hover:bg-[#f4efeb]"
        >
          Повернути
        </button>
      </div>
    </div>
  )
}

export function CartPage() {
  const { items, ready, totalCount, totalPrice, removeItem, restoreItem, updateQuantity, clear } = useCart()
  const [step, setStep] = useState<Step>('cart')
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('info')
  // Furthest step reached; you can also go back to it via the tab
  const [reached, setReached] = useState(0)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Checked on the first step: otherwise a typo only surfaces after delivery and payment are filled in
  const [phoneError, setPhoneError] = useState('')
  const [placed, setPlaced] = useState<PlacedOrder | null>(null)
  // Consent to the public offer: required before checkout
  const [agreed, setAgreed] = useState(false)
  // "Оформити замовлення" stays clickable; pressed without the consent it points at the checkbox
  const [consentMissing, setConsentMissing] = useState(false)
  const consentRef = useRef<HTMLInputElement>(null)
  // Last removed line, until the toast closes: a stray click on the cross does not cost the purchase
  const [removed, setRemoved] = useState<{ item: CartItem; index: number; at: number } | null>(null)
  const closeToast = useCallback(() => setRemoved(null), [])

  function remove(index: number) {
    setRemoved({ item: items[index], index, at: Date.now() })
    removeItem(index)
  }

  const toast = removed && (
    <RemovedToast
      key={removed.at}
      onUndo={() => {
        restoreItem(removed.item, removed.index)
        setRemoved(null)
      }}
      onClose={closeToast}
    />
  )
  const [form, setForm] = useState<CheckoutForm>({
    customerName: '',
    phone: '',
    city: '',
    novaPoshtaBranch: '',
    email: '',
    comment: '',
  })

  function goTo(next: Step) {
    setRemoved(null)
    setStep(next)
    window.scrollTo({ top: 0 })
  }

  function goToCheckoutStep(next: CheckoutStep) {
    const index = CHECKOUT_STEPS.findIndex((s) => s.id === next)
    setReached((r) => Math.max(r, index))
    setCheckoutStep(next)
    window.scrollTo({ top: 0 })
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (e.target.name === 'phone') setPhoneError('')
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!items.length) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, form: { ...form, customerName: `${firstName.trim()} ${lastName.trim()}`.trim() } }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(res.status === 400 && data?.error ? data.error : '')
      }
      const data = await res.json().catch(() => null)
      setPlaced({
        id: data?.orderId ?? '',
        items,
        total: totalPrice,
        address: `Нова пошта, ${form.city}, відділення ${form.novaPoshtaBranch}`,
        phone: form.phone,
        paymentMethod: form.paymentMethod,
      })
      clear()
      goTo('success')
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Щось пішло не так. Спробуйте ще раз або зв'яжіться з нами.",
      )
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success' && placed) return <OrderSuccess order={placed} />

  // Until the cart is read from localStorage, show nothing rather than a flash of "Кошик порожній"
  if (!ready) return <div className="min-h-[50vh]" />
  if (!items.length)
    return (
      <>
        <EmptyCart />
        {toast}
      </>
    )

  // STEP 1: cart
  if (step === 'cart') {
    return (
      <div className="pb-6">
        <Breadcrumbs items={[{ name: 'Головна', href: '/' }, { name: 'Кошик' }]} />
        <h1 className="heading-page mt-2">
          Кошик <span className="text-brown/60">({totalCount})</span>
        </h1>

        <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-16">
          <section aria-label="Товари в кошику">
            <ul className="divide-y divide-brown/15 border-y border-brown/15">
              {items.map((item, i) => (
                <BagItem
                  key={`${item.productId}-${item.size}-${item.color}`}
                  item={item}
                  onRemove={() => remove(i)}
                  onQuantity={(q) => updateQuantity(i, q)}
                />
              ))}
            </ul>
            <Link
              href="/catalog"
              className="mt-5 inline-flex items-center gap-2 text-sm text-brown underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Продовжити покупки
            </Link>
          </section>

          <aside className="mt-10 rounded-card bg-[#f4efeb] px-6 py-6 lg:sticky lg:top-8 lg:mt-0 lg:px-8 lg:py-7">
            <h2 className="mb-5 text-lg font-medium text-ink">Підсумок</h2>
            <Totals total={totalPrice} />
            <label className="mt-6 flex cursor-pointer items-start gap-2.5 text-[13px] leading-5 text-brown">
              {/* Own box instead of the native one: its border turns brick red when the consent is missing */}
              <span className="relative mt-px flex size-[18px] shrink-0">
                <input
                  ref={consentRef}
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked)
                    if (e.target.checked) setConsentMissing(false)
                  }}
                  aria-invalid={consentMissing || undefined}
                  aria-describedby={consentMissing ? 'consent-error' : undefined}
                  className="peer size-full cursor-pointer appearance-none rounded-[5px] border border-brown/60 bg-white transition-colors checked:border-ink checked:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-[invalid=true]:border-[1.5px] aria-[invalid=true]:border-destructive"
                />
                <Check
                  className="pointer-events-none absolute inset-0 m-auto hidden h-3 w-3 text-white peer-checked:block"
                  strokeWidth={3}
                  aria-hidden
                />
              </span>
              <span>
                Я погоджуюсь з{' '}
                <Link href="/oferta" target="_blank" className="underline underline-offset-2 transition-colors hover:text-ink">
                  умовами договору публічної оферти
                </Link>
              </span>
            </label>
            {consentMissing && (
              <p id="consent-error" role="alert" className="mt-2 text-[13px] text-destructive">
                Поставте позначку, щоб продовжити
              </p>
            )}
            {/* Always clickable: a greyed-out button looks broken. Without the consent it points at the checkbox */}
            <button
              type="button"
              onClick={() => {
                if (!agreed) {
                  setConsentMissing(true)
                  consentRef.current?.focus()
                  return
                }
                goTo('checkout')
              }}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-card bg-ink text-[15px] text-white transition-colors hover:bg-ink/90"
            >
              Оформити замовлення
            </button>
          </aside>
        </div>
        {toast}
      </div>
    )
  }

  // STEP 2: checkout
  return (
    <div className="lg:grid lg:grid-cols-[468px_406px] lg:justify-between">
      <section>
        <button type="button" onClick={() => goTo('cart')} aria-label="Назад до кошика" className="transition-opacity hover:opacity-70">
          <Image src="/brand/arrow-long.svg" alt="" width={61} height={14} className="h-[14px] w-[61px]" />
        </button>
        <h1 className="mt-10 font-serif text-[32px] uppercase tracking-[2px] text-ink">Оформлення</h1>

        {/* Step tabs: completed ones can be reopened, the next ones only via the button */}
        <nav aria-label="Кроки оформлення" className="mt-8 flex gap-11 text-sm sm:text-base">
          {CHECKOUT_STEPS.map((s, i) => {
            const current = s.id === checkoutStep
            return (
              <button
                key={s.id}
                type="button"
                disabled={i > reached}
                aria-current={current ? 'step' : undefined}
                onClick={() => setCheckoutStep(s.id)}
                className={cn('transition-colors', current ? 'text-ink' : 'text-brown/50 enabled:hover:text-brown')}
              >
                {s.label}
              </button>
            )
          })}
        </nav>

        {checkoutStep === 'info' && (
          <form
            className="mt-10"
            onSubmit={(e) => {
              e.preventDefault()
              if (!normalizeUaPhone(form.phone)) {
                setPhoneError(PHONE_ERROR)
                e.currentTarget.querySelector<HTMLInputElement>('input[name=phone]')?.focus()
                return
              }
              goToCheckoutStep('shipping')
            }}
          >
            <h2 className="font-serif text-sm uppercase text-ink">Контактні дані</h2>
            <div className="mt-3 space-y-4">
              <div>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Телефон, +380…"
                  autoComplete="tel"
                  required
                  aria-label="Телефон"
                  aria-invalid={phoneError ? true : undefined}
                  aria-describedby={phoneError ? 'phone-error' : undefined}
                  className={cn(field, phoneError && 'border-destructive')}
                />
                {phoneError && (
                  <p id="phone-error" role="alert" className="mt-1.5 text-xs text-destructive">
                    {phoneError}
                  </p>
                )}
              </div>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email (необов'язково)" autoComplete="email" aria-label="Email" className={field} />
            </div>

            <h2 className="mt-10 font-serif text-sm uppercase text-ink">Отримувач</h2>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ім'я" autoComplete="given-name" required aria-label="Ім'я" className={field} />
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Прізвище" autoComplete="family-name" required aria-label="Прізвище" className={field} />
            </div>

            <NextButton>Доставка</NextButton>
          </form>
        )}

        {checkoutStep === 'shipping' && (
          <form
            className="mt-10"
            onSubmit={(e) => {
              e.preventDefault()
              goToCheckoutStep('payment')
            }}
          >
            <h2 className="font-serif text-sm uppercase text-ink">Доставка Новою поштою</h2>
            <div className="mt-3 grid grid-cols-2 gap-1.5 gap-y-4">
              <input name="city" value={form.city} onChange={handleChange} placeholder="Місто" autoComplete="address-level2" required aria-label="Місто" className={field} />
              <input name="novaPoshtaBranch" value={form.novaPoshtaBranch} onChange={handleChange} placeholder="№ відділення" required aria-label="Номер відділення Нової пошти" className={field} />
              <textarea name="comment" value={form.comment} onChange={handleChange} placeholder="Коментар до замовлення" aria-label="Коментар" rows={3} className={cn(field, 'col-span-2 h-auto py-3')} />
            </div>

            <NextButton>Оплата</NextButton>
          </form>
        )}

        {checkoutStep === 'payment' && (
          <form onSubmit={handleSubmit} className="mt-10">
            <h2 className="font-serif text-sm uppercase text-ink">Перевірте дані</h2>
            <dl className="mt-3 divide-y divide-[#b6ada3] border-y border-[#b6ada3] text-xs text-brown">
              {[
                { label: 'Отримувач', value: `${firstName} ${lastName}`, step: 'info' as const },
                { label: 'Контакти', value: [form.phone, form.email].filter(Boolean).join(', '), step: 'info' as const },
                {
                  label: 'Доставка',
                  value: `Нова пошта, ${form.city}, відділення ${form.novaPoshtaBranch}`,
                  step: 'shipping' as const,
                },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-4 py-3">
                  <dt className="w-24 shrink-0 text-brown/50">{row.label}</dt>
                  <dd className="flex-1 text-ink">{row.value}</dd>
                  <button type="button" onClick={() => setCheckoutStep(row.step)} className="shrink-0 underline underline-offset-2">
                    Змінити
                  </button>
                </div>
              ))}
            </dl>

            <fieldset className="mt-8">
              <legend className="font-serif text-sm uppercase text-ink">Спосіб оплати</legend>
              <div className="mt-3 space-y-3">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.value}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 border px-5 py-4 text-xs transition-colors',
                      form.paymentMethod === m.value ? 'border-ink' : 'border-[#b6ada3] hover:border-brown',
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.value}
                      checked={form.paymentMethod === m.value}
                      onChange={() => setForm((prev) => ({ ...prev, paymentMethod: m.value }))}
                      required
                      className="mt-0.5 accent-ink"
                    />
                    <span>
                      <span className="block text-ink">{m.label}</span>
                      <span className="mt-1 block text-brown/60">{m.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="mt-4 text-xs leading-[18px] text-brown/60">
              Менеджер зателефонує, щоб підтвердити замовлення та спосіб оплати. Онлайн-оплати на сайті немає.
            </p>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <NextButton disabled={loading}>{loading ? 'Відправляємо…' : 'Підтвердити'}</NextButton>
          </form>
        )}
      </section>

      <aside className="relative mt-12 border border-[#b6ada3] px-5 py-8 lg:mt-[188px] lg:self-start lg:px-10 lg:py-10">
        <span className="absolute right-4 top-2 text-xs text-brown/80">({totalCount})</span>
        <h2 className="font-serif text-sm uppercase tracking-[1px] text-black">Ваше замовлення</h2>
        <ul className="mt-6 space-y-6 border-b border-[#b6ada3] pb-6">
          {items.map((item) => (
            <li key={`${item.productId}-${item.size}-${item.color}`}>
              <OrderLine item={item} onChange={() => goTo('cart')} />
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Totals total={totalPrice} />
        </div>
      </aside>
    </div>
  )
}
