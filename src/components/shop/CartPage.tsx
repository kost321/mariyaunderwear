'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, ChevronDown, Loader2, ShoppingBag, X } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { cn, colorLabel, formatPrice, shortProductTitle } from '@/lib/utils'
import { Breadcrumbs } from '@/components/shop/Breadcrumbs'
import { FormField } from '@/components/shop/FormField'
import { OrderTotals } from '@/components/shop/OrderTotals'
import { QuantityStepper } from '@/components/shop/QuantityStepper'
import { primaryButton } from '@/components/shop/StatusScreen'
import { CONTACTS, phoneHref } from '@/lib/contacts'
import type { CartItem, CheckoutForm } from '@/types/shop'
import { PAYMENT_METHODS } from '@/lib/payment'
import { normalizeUaPhone, PHONE_ERROR, UA_PHONE_PREFIX, uaPhoneDigits } from '@/lib/phone'
import { newOrderKey, SERVER_ERROR, submitOrder } from '@/lib/submitOrder'
import { usePhoneMask } from '@/hooks/usePhoneMask'

type Step = 'cart' | 'checkout'

/** Draft of the checkout form in sessionStorage */
const CHECKOUT_DRAFT_KEY = 'olga-checkout-draft'

// Checkout tabs from the design: Information → Shipping → Payment
const CHECKOUT_STEPS = [
  { id: 'info', label: 'Інформація' },
  { id: 'shipping', label: 'Доставка' },
  { id: 'payment', label: 'Оплата' },
] as const
type CheckoutStep = (typeof CHECKOUT_STEPS)[number]['id']

const photo = 'relative overflow-hidden rounded-card bg-placeholder/40'

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

/** Section title inside the checkout forms ("Контактні дані"), in normal case like the cart's "Підсумок". */
const subheading = 'text-lg font-medium text-ink'

/** Main checkout button: dark, the full width of the form; "Доставка ⟶" with the long arrow of the design. */
function NextButton({
  children,
  busy,
  arrow = true,
}: {
  children: React.ReactNode
  /** The order is on its way: the button is locked but stays dark (a greyed-out one looks broken) */
  busy?: boolean
  arrow?: boolean
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      aria-busy={busy || undefined}
      className={cn(
        'mt-8 flex h-12 w-full items-center rounded-card bg-ink text-[15px] text-white transition-colors enabled:hover:bg-ink/90 disabled:cursor-wait',
        arrow ? 'justify-between pl-7 pr-5' : 'justify-center',
      )}
    >
      {children}
      {/* The arrow file is brown; brightness-0 + invert turns it white on the dark button */}
      {arrow && <Image src="/brand/arrow-long.svg" alt="" width={49} height={14} className="-scale-x-100 brightness-0 invert" />}
    </button>
  )
}

/** Step tabs "1 Інформація · 2 Доставка · 3 Оплата": the current one underlined, passed ones ticked and reopenable. */
function CheckoutSteps({
  current,
  reached,
  onSelect,
}: {
  current: CheckoutStep
  reached: number
  onSelect: (step: CheckoutStep) => void
}) {
  const currentIndex = CHECKOUT_STEPS.findIndex((s) => s.id === current)
  return (
    <nav aria-label="Кроки оформлення">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px]">
        {CHECKOUT_STEPS.map((s, i) => {
          const isCurrent = i === currentIndex
          return (
            <li key={s.id} className="flex items-center gap-3">
              {i > 0 && (
                // Lifted by the height of the underline under the step names, so it sits on their middle
                <span aria-hidden className="mb-[6px] text-brown/40">
                  ·
                </span>
              )}
              <button
                type="button"
                disabled={i > reached}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => onSelect(s.id)}
                className={cn(
                  'flex items-center gap-1.5 border-b-2 pb-1 transition-colors',
                  isCurrent
                    ? 'border-ink font-medium text-ink'
                    : 'border-transparent text-brown enabled:hover:text-ink disabled:text-brown/50',
                )}
              >
                {i < currentIndex ? (
                  <Check className="h-4 w-4" strokeWidth={2} aria-label="пройдено" />
                ) : (
                  <span className="tabular-nums">{i + 1}</span>
                )}
                {s.label}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Line of the "Ваше замовлення" panel: small photo, the name as in the cart, colour · size, amount. */
function SummaryItem({ item }: { item: CartItem }) {
  return (
    <li className="flex gap-3">
      <div className={cn(photo, 'aspect-[4/5] w-16 shrink-0 rounded-xl')}>
        {item.image && <Image src={item.image} alt={item.title} fill quality={90} sizes="64px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="leading-5 text-ink">{shortProductTitle(item.title)}</p>
        <p className="mt-1 text-brown">
          {variantLine(item)}
          {item.quantity > 1 && ` · ${item.quantity} шт.`}
        </p>
      </div>
      <p className="shrink-0 text-sm tabular-nums text-ink">{formatPrice(item.price * item.quantity)}</p>
    </li>
  )
}

/** Contents of "Ваше замовлення": the lines and the totals (desktop panel and the phone drop-down). */
function OrderSummary({ items, total }: { items: CartItem[]; total: number }) {
  return (
    <>
      <ul className="space-y-4">
        {items.map((item) => (
          <SummaryItem key={`${item.productId}-${item.size}-${item.color}`} item={item} />
        ))}
      </ul>
      <div className="mt-5 border-t border-brown/15 pt-5">
        <OrderTotals total={total} />
      </div>
    </>
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
  // Guard against a second submit while the order is on its way
  const submitting = useRef(false)
  // Key of this checkout attempt, sent with every retry; a new one once the cart changes
  const orderKey = useRef('')
  useEffect(() => {
    orderKey.current = newOrderKey()
  }, [items])
  // Checked on the first step: otherwise a typo only surfaces after delivery and payment are filled in
  const [phoneError, setPhoneError] = useState('')
  // Names are checked softly: Latin letters get a hint (Nova Poshta matches the passport), nothing is blocked
  const [namesTouched, setNamesTouched] = useState(false)
  const latinName = namesTouched && /[a-z]/i.test(firstName + lastName)
  // "Ваше замовлення" on phones: collapsed to one line above the form
  const [summaryOpen, setSummaryOpen] = useState(false)
  // The order went through and the "order accepted" page is opening: the cart is already empty by then,
  // so this keeps "Кошик порожній" from flashing for a moment
  const [redirecting, setRedirecting] = useState(false)
  const router = useRouter()
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
    // The country code is already typed in; the mask keeps it (lib/phone formatUaPhoneInput)
    phone: UA_PHONE_PREFIX,
    city: '',
    novaPoshtaBranch: '',
    email: '',
    comment: '',
  })
  const phone = usePhoneMask(form.phone, (next) => {
    setPhoneError('')
    setForm((prev) => ({ ...prev, phone: next }))
  })

  // What is typed survives a reload of the page or a crash screen ("Спробувати ще раз" re-mounts the cart):
  // kept for this tab only (sessionStorage) and dropped once the order is placed
  const [restored, setRestored] = useState(false)
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(CHECKOUT_DRAFT_KEY) ?? 'null')
      if (saved?.form) {
        setForm((prev) => ({ ...prev, ...saved.form }))
        setFirstName(saved.firstName ?? '')
        setLastName(saved.lastName ?? '')
      }
    } catch {
      // a broken draft is ignored
    }
    setRestored(true)
  }, [])
  useEffect(() => {
    if (restored) sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({ form, firstName, lastName }))
  }, [restored, form, firstName, lastName])

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
    // The disabled button is not enough on its own: a double click or Enter can land before React re-renders
    if (!items.length || submitting.current) return
    submitting.current = true
    setLoading(true)
    setError('')
    try {
      const placed = await submitOrder({
        items,
        form: { ...form, customerName: `${firstName.trim()} ${lastName.trim()}`.trim() },
        orderKey: orderKey.current,
      })
      // The order has its own page (/order/<signed token>, see lib/orderToken): a reload there shows the
      // saved order again and sends nothing; replace() keeps the back button from returning to the form
      setRedirecting(true)
      sessionStorage.removeItem(CHECKOUT_DRAFT_KEY)
      router.replace(placed.token ? `/order/${placed.token}` : '/')
      clear()
    } catch (e) {
      // Everything typed stays in the form: the customer only presses the button again
      setError(e instanceof Error && e.message ? e.message : SERVER_ERROR)
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  if (redirecting) return <div className="min-h-[50vh]" />

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
            <OrderTotals total={totalPrice} />
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
    <div className="pb-6">
      <button
        type="button"
        onClick={() => goTo('cart')}
        className="inline-flex items-center gap-2 text-sm text-brown underline-offset-4 transition-colors hover:text-ink hover:underline"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        Повернутися до кошика
      </button>
      <h1 className="heading-page mt-2">Оформлення</h1>

      {/* Phones: the order collapsed to one line above the form, so the total is in sight without scrolling */}
      <div className="mt-6 rounded-card bg-[#f4efeb] lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((o) => !o)}
          aria-expanded={summaryOpen}
          aria-controls="order-summary-mobile"
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-[15px] text-ink"
        >
          <span>
            Ваше замовлення <span className="text-brown/60">({totalCount})</span>
          </span>
          <span className="flex items-center gap-2 font-medium tabular-nums">
            {formatPrice(totalPrice)}
            <ChevronDown className={cn('h-4 w-4 transition-transform', summaryOpen && 'rotate-180')} strokeWidth={1.5} aria-hidden />
          </span>
        </button>
        {summaryOpen && (
          <div id="order-summary-mobile" className="border-t border-brown/15 px-5 pb-5 pt-4">
            <OrderSummary items={items} total={totalPrice} />
            <button
              type="button"
              onClick={() => goTo('cart')}
              className="mt-4 text-sm text-brown underline underline-offset-4 transition-colors hover:text-ink"
            >
              Змінити в кошику
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-16">
        <section className="max-w-[560px]">
          <CheckoutSteps current={checkoutStep} reached={reached} onSelect={setCheckoutStep} />

          {checkoutStep === 'info' && (
            <form
              className="mt-8"
              onSubmit={(e) => {
                e.preventDefault()
                if (!normalizeUaPhone(form.phone)) {
                  setPhoneError(PHONE_ERROR)
                  phone.ref.current?.focus()
                  return
                }
                goToCheckoutStep('shipping')
              }}
            >
              <h2 className={subheading}>Контактні дані</h2>
              <div className="mt-4 grid gap-5">
                <FormField
                  label="Телефон"
                  required
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  inputRef={phone.ref}
                  value={form.phone}
                  onChange={phone.onChange}
                  onBlur={() => {
                    // A half-typed number is pointed out on leaving the field; an untouched one only on "Доставка"
                    if (uaPhoneDigits(form.phone) > 0 && !normalizeUaPhone(form.phone)) setPhoneError(PHONE_ERROR)
                  }}
                  placeholder="+380 (__) ___ __ __"
                  error={phoneError}
                  hint="Менеджер зателефонує, щоб підтвердити замовлення"
                />
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                />
              </div>

              <h2 className={cn(subheading, 'mt-10')}>Отримувач</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <FormField
                  label="Імʼя"
                  required
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => setNamesTouched(true)}
                />
                <FormField
                  label="Прізвище"
                  required
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => setNamesTouched(true)}
                />
              </div>
              <p aria-live="polite" className={cn('mt-1.5 px-5 text-xs leading-5', latinName ? 'text-ink' : 'text-brown')}>
                {latinName
                  ? 'Схоже, імʼя написане латиницею. Для Нової пошти краще українською, як у паспорті'
                  : 'Як у паспорті, українською'}
              </p>

              <NextButton>Доставка</NextButton>
            </form>
          )}

          {checkoutStep === 'shipping' && (
            <form
              className="mt-8"
              onSubmit={(e) => {
                e.preventDefault()
                goToCheckoutStep('payment')
              }}
            >
              <h2 className={subheading}>Доставка Новою поштою</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <FormField
                  label="Місто"
                  required
                  name="city"
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={handleChange}
                />
                <FormField
                  label="№ відділення"
                  required
                  name="novaPoshtaBranch"
                  value={form.novaPoshtaBranch}
                  onChange={handleChange}
                  placeholder="Наприклад, 12"
                />
                <div className="sm:col-span-2">
                  <label htmlFor="checkout-comment" className="mb-1.5 block text-sm text-brown">
                    Коментар до замовлення
                  </label>
                  {/* Rounded border on a wrapper, so the resize grip stays inside the curve (as on "Співпраця") */}
                  <div className="rounded-[20px] border border-brown/30 bg-white p-1.5 focus-within:border-ink">
                    <textarea
                      id="checkout-comment"
                      name="comment"
                      value={form.comment}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Наприклад, зручний час для дзвінка"
                      className="block w-full resize-y bg-transparent px-3.5 py-1.5 text-sm leading-6 text-ink placeholder:text-brown/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <NextButton>Оплата</NextButton>
            </form>
          )}

          {checkoutStep === 'payment' && (
            <form onSubmit={handleSubmit} className="mt-8">
              <h2 className={subheading}>Перевірте дані</h2>
              <dl className="mt-4 divide-y divide-brown/15 border-y border-brown/15 text-sm">
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
                    <dt className="w-24 shrink-0 text-brown">{row.label}</dt>
                    <dd className="min-w-0 flex-1 text-ink">{row.value}</dd>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(row.step)}
                      className="shrink-0 text-brown underline underline-offset-4 transition-colors hover:text-ink"
                    >
                      Змінити
                    </button>
                  </div>
                ))}
              </dl>

              <fieldset className="mt-10">
                <legend className={subheading}>Спосіб оплати</legend>
                <div className="mt-4 space-y-3">
                  {PAYMENT_METHODS.map((m) => (
                    <label
                      key={m.value}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-2xl border px-5 py-4 text-sm transition-colors',
                        form.paymentMethod === m.value ? 'border-ink bg-[#f4efeb]' : 'border-brown/30 hover:border-brown',
                      )}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={m.value}
                        checked={form.paymentMethod === m.value}
                        onChange={() => setForm((prev) => ({ ...prev, paymentMethod: m.value }))}
                        required
                        className="mt-1 accent-ink"
                      />
                      <span>
                        <span className="block text-ink">{m.label}</span>
                        <span className="mt-1 block text-brown">{m.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="mt-4 text-sm leading-6 text-brown">
                Менеджер зателефонує, щоб підтвердити замовлення та спосіб оплати. Онлайн-оплати на сайті немає.
              </p>

              <NextButton busy={loading} arrow={false}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Оформлюємо…
                  </span>
                ) : error ? (
                  'Спробувати ще раз'
                ) : (
                  'Підтвердити замовлення'
                )}
              </NextButton>
              {/* Under the button, where the eye is after pressing it; a phone number as the way out */}
              {error && (
                <div role="alert" className="mt-3 text-sm leading-6">
                  <p className="text-destructive">{error}</p>
                  <p className="mt-1 text-brown">
                    Якщо не виходить, зателефонуйте нам:{' '}
                    <a href={`tel:${phoneHref(CONTACTS.phone)}`} className="whitespace-nowrap text-ink underline underline-offset-4 hover:no-underline">
                      {CONTACTS.phone}
                    </a>
                  </p>
                </div>
              )}
            </form>
          )}
        </section>

        <aside className="hidden rounded-card bg-[#f4efeb] px-8 py-7 lg:sticky lg:top-8 lg:block">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-medium text-ink">
              Ваше замовлення <span className="text-brown/60">({totalCount})</span>
            </h2>
            <button
              type="button"
              onClick={() => goTo('cart')}
              className="text-sm text-brown underline underline-offset-4 transition-colors hover:text-ink"
            >
              Змінити
            </button>
          </div>
          <OrderSummary items={items} total={totalPrice} />
        </aside>
      </div>
    </div>
  )
}
