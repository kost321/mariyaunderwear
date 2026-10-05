'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { cn, formatPrice } from '@/lib/utils'
import type { CartItem, CheckoutForm } from '@/types/shop'

type Step = 'cart' | 'checkout' | 'success'

// Checkout tabs from the design: Information → Shipping → Payment
const CHECKOUT_STEPS = [
  { id: 'info', label: 'Інформація' },
  { id: 'shipping', label: 'Доставка' },
  { id: 'payment', label: 'Оплата' },
] as const
type CheckoutStep = (typeof CHECKOUT_STEPS)[number]['id']

const photo = 'relative overflow-hidden rounded-card border border-[#d9d9d9] bg-placeholder/40'
const pill =
  'flex h-10 w-full items-center justify-center rounded-card bg-cream/70 text-xs uppercase tracking-[1px] text-ink transition-colors hover:bg-cream disabled:opacity-60'
const field =
  'h-11 w-full border border-[#b6ada3] px-5 text-xs text-ink placeholder:text-brown/50 focus:border-ink focus:outline-none'

/** Empty cart / thank-you: heading + button to the catalog. */
function Message({ title, text }: { title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center gap-5 py-24 text-center">
      <h1 className="font-serif text-2xl uppercase tracking-[2px] text-ink lg:text-[32px]">{title}</h1>
      {text && <p className="text-sm tracking-[1px] text-brown/60">{text}</p>}
      <Link href="/catalog" className={cn(pill, 'mt-4 w-[265px]')}>
        Перейти до каталогу
      </Link>
    </div>
  )
}

/** "Next" button with an arrow, like "Shipping →" in the design. */
function NextButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <div className="mt-6 flex justify-end">
      <button
        type="submit"
        disabled={disabled}
        className="flex h-11 w-full items-center justify-between rounded-card bg-cream/70 px-6 font-serif text-sm text-ink transition-colors hover:bg-cream disabled:opacity-60 sm:w-[231px]"
      >
        {children}
        <Image src="/brand/arrow-long.svg" alt="" width={49} height={14} className="-scale-x-100" />
      </button>
    </div>
  )
}

/** "Summary" block: subtotal, delivery, total. */
function Totals({ total, large }: { total: number; large?: boolean }) {
  return (
    <>
      <dl className="space-y-1.5 text-xs tracking-[1px] text-brown">
        <div className="flex justify-between">
          <dt>Сума</dt>
          <dd className="font-serif text-ink/50">{formatPrice(total)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Доставка</dt>
          <dd className="text-right text-[10px] text-brown/50">за тарифами Нової пошти</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-baseline justify-between border-t border-[#b6ada3] pt-4">
        <span className={cn('font-serif uppercase tracking-[1px] text-ink', large ? 'text-base' : 'text-sm')}>Разом</span>
        <span className="font-serif text-base tracking-[1px] text-brown">{formatPrice(total)}</span>
      </div>
    </>
  )
}

/** Cart line: large photo; on the right remove, size, color, quantity. */
function BagItem({
  item,
  onRemove,
  onQuantity,
}: {
  item: CartItem
  onRemove: () => void
  onQuantity: (q: number) => void
}) {
  return (
    <div>
      <div className="flex gap-4">
        <Link href={`/product/${item.slug}`} className={cn(photo, 'aspect-[265/313] flex-1')}>
          {item.image && <Image src={item.image} alt={item.title} fill quality={90} sizes="(max-width: 1024px) 90vw, 540px" className="object-cover" />}
        </Link>
        <div className="flex w-[25px] flex-col items-center gap-6 text-sm text-ink">
          <button type="button" onClick={onRemove} aria-label={`Прибрати ${item.title}`} className="text-brown/70 hover:text-ink">
            <X className="h-5 w-5" strokeWidth={1.25} />
          </button>
          {item.size && <span className="mt-6">{item.size}</span>}
          <div className="flex flex-col border border-brown/60 text-xs">
            <button
              type="button"
              onClick={() => onQuantity(item.quantity + 1)}
              aria-label="Збільшити кількість"
              className="h-[22px] w-[25px]"
            >
              +
            </button>
            <span className="h-[22px] w-[25px] border-y border-brown/60 text-center leading-[20px] tabular-nums" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label="Зменшити кількість"
              className="h-[22px] w-[25px] disabled:opacity-30"
            >
              −
            </button>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3 pr-[41px]">
        <div className="min-w-0">
          {item.color && <p className="font-serif text-xs text-brown/50">{item.color}</p>}
          <p className="mt-1 font-serif text-sm text-ink">{item.title}</p>
        </div>
        <p className="shrink-0 whitespace-nowrap font-serif text-sm text-ink/50">{formatPrice(item.price * item.quantity)}</p>
      </div>
    </div>
  )
}

export function CartPage() {
  const { items, totalCount, totalPrice, removeItem, updateQuantity, clear } = useCart()
  const [step, setStep] = useState<Step>('cart')
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('info')
  // Furthest step reached; you can also go back to it via the tab
  const [reached, setReached] = useState(0)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<CheckoutForm>({
    customerName: '',
    phone: '',
    city: '',
    novaPoshtaBranch: '',
    email: '',
    comment: '',
  })

  function goTo(next: Step) {
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

  if (step === 'success') {
    return <Message title="Дякуємо за замовлення!" text="Ми зв'яжемось з вами найближчим часом." />
  }

  if (!items.length) return <Message title="Кошик порожній" />

  // STEP 1: cart
  if (step === 'cart') {
    return (
      <div className="lg:grid lg:grid-cols-[712px_306px] lg:justify-between lg:pt-[60px]">
        <section>
          <h1 className="border-b border-[#b6ada3] pb-4 font-serif text-base uppercase text-ink">Кошик</h1>
          <div className="grid gap-x-10 gap-y-12 border-b border-[#b6ada3] py-5 sm:grid-cols-2">
            {items.map((item, i) => (
              <BagItem
                key={`${item.productId}-${item.size}-${item.color}`}
                item={item}
                onRemove={() => removeItem(i)}
                onQuantity={(q) => updateQuantity(i, q)}
              />
            ))}
          </div>
        </section>

        <aside className="mt-10 border border-[#b6ada3] px-6 py-10 lg:mt-[31px] lg:self-start lg:px-10 lg:py-14">
          <h2 className="mb-6 font-serif text-sm uppercase tracking-[1px] text-ink">Підсумок</h2>
          <Totals total={totalPrice} large />
          <button type="button" onClick={() => goTo('checkout')} className={cn(pill, 'mt-10')}>
            Оформити замовлення
          </button>
        </aside>
      </div>
    )
  }

  // STEP 2: checkout
  return (
    <div className="lg:grid lg:grid-cols-[468px_406px] lg:justify-between">
      <section>
        <button type="button" onClick={() => goTo('cart')} aria-label="Назад до кошика" className="transition-opacity hover:opacity-70">
          <Image src="/brand/arrow-long.svg" alt="" width={61} height={14} className="w-[61px]" />
        </button>
        <h1 className="mt-10 font-serif text-[32px] uppercase tracking-[2px] text-ink">Оформлення</h1>

        {/* Step tabs: completed ones can be reopened, the next ones only via the button */}
        <nav aria-label="Кроки оформлення" className="mt-8 flex gap-11 text-sm uppercase sm:text-base">
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
              goToCheckoutStep('shipping')
            }}
          >
            <h2 className="font-serif text-sm uppercase text-ink">Контактні дані</h2>
            <div className="mt-3 space-y-4">
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="Телефон, +380…" autoComplete="tel" required aria-label="Телефон" className={field} />
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
            <p className="mt-4 text-xs leading-[18px] text-brown/60">
              Спосіб оплати менеджер уточнить, коли зателефонує підтвердити замовлення.
            </p>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <NextButton disabled={loading}>{loading ? 'Відправляємо…' : 'Підтвердити'}</NextButton>
          </form>
        )}
      </section>

      <aside className="relative mt-12 border border-[#b6ada3] px-5 py-8 lg:mt-[188px] lg:self-start lg:px-10 lg:py-10">
        <span className="absolute right-4 top-2 font-script text-sm tracking-[1px] text-pink">({totalCount})</span>
        <h2 className="font-serif text-sm uppercase tracking-[1px] text-black">Ваше замовлення</h2>
        <ul className="mt-6 space-y-6 border-b border-[#b6ada3] pb-6">
          {items.map((item) => (
            <li key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3">
              <div className={cn(photo, 'h-[133px] w-[113px] shrink-0')}>
                {item.image && <Image src={item.image} alt={item.title} fill quality={90} sizes="113px" className="object-cover" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-serif text-sm text-black">{item.title}</p>
                  <button type="button" onClick={() => goTo('cart')} className="shrink-0 text-xs text-brown underline underline-offset-2">
                    Змінити
                  </button>
                </div>
                <p className="mt-2 text-xs text-brown">{[item.color, item.size].filter(Boolean).join(' / ')}</p>
                <div className="mt-auto flex items-baseline justify-between">
                  <span className="font-script text-sm text-pink">({item.quantity})</span>
                  <span className="text-[13px] text-brown/50">{formatPrice(item.price * item.quantity)}</span>
                </div>
              </div>
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
