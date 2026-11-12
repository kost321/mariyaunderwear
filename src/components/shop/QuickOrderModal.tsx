'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Check, Loader2, X } from 'lucide-react'
import type { CartItem } from '@/types/shop'
import { normalizeUaPhone, PHONE_ERROR, UA_PHONE_PREFIX, uaPhoneDigits } from '@/lib/phone'
import { newOrderKey, SERVER_ERROR, submitOrder } from '@/lib/submitOrder'
import { CONTACTS, phoneHref } from '@/lib/contacts'
import { colorLabel, formatPrice, shortProductTitle } from '@/lib/utils'
import { usePhoneMask } from '@/hooks/usePhoneMask'
import { FormField } from '@/components/shop/FormField'

/**
 * "Купити в 1 клік": name and phone only, the order goes straight to /api/order and the manager calls back
 * for delivery and payment. `item` is the current choice on the product page (colour, size, quantity).
 *
 * Laid out like the size chart: a bottom sheet with a grab handle on phones, a centred window on larger
 * screens, portalled to <body> (inside the sticky product panel it would sit under the header). Sending
 * works like the checkout (lib/submitOrder): the button is locked, a retry reuses the order key, and the
 * error stays under the button with the shop's phone. After the order the window says so itself.
 */
export function QuickOrderModal({ open, onClose, item }: { open: boolean; onClose: () => void; item: CartItem }) {
  const [name, setName] = useState('')
  const [phoneValue, setPhoneValue] = useState(UA_PHONE_PREFIX)
  const [phoneError, setPhoneError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState<number | null>(null)
  const submitting = useRef(false)
  const orderKey = useRef('')
  const phone = usePhoneMask(phoneValue, (next) => {
    setPhoneError('')
    setPhoneValue(next)
  })

  // Esc closes, the page under the window does not scroll
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  // A fresh form and a new order key on every open; name and phone are kept if the window is reopened
  // without ordering (a misclick on the backdrop should not cost the typing)
  useEffect(() => {
    if (!open) return
    setError('')
    setPhoneError('')
    setOrderId(null)
    orderKey.current = newOrderKey()
  }, [open])

  if (!open) return null

  const title = shortProductTitle(item.title)
  const variant = [item.color && colorLabel(item.color), item.size, `${item.quantity} шт.`].filter(Boolean).join(' · ')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting.current) return
    if (!normalizeUaPhone(phoneValue)) {
      setPhoneError(PHONE_ERROR)
      phone.ref.current?.focus()
      return
    }
    submitting.current = true
    setLoading(true)
    setError('')
    try {
      const placed = await submitOrder({
        items: [item],
        form: {
          customerName: name.trim(),
          phone: phoneValue,
          city: '',
          novaPoshtaBranch: '',
          comment: 'Швидке замовлення — уточнити деталі по телефону',
        },
        orderKey: orderKey.current,
      })
      setOrderId(placed.orderId)
      setName('')
      setPhoneValue(UA_PHONE_PREFIX)
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : SERVER_ERROR)
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-order-title"
    >
      <div
        className="relative max-h-[90vh] w-full overflow-y-auto overscroll-contain rounded-t-card bg-white px-5 pb-6 pt-3 shadow-xl sm:max-w-md sm:rounded-card sm:px-8 sm:pb-8 sm:pt-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab handle of the bottom sheet (phones) */}
        <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-brown/25 sm:hidden" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-brown transition-colors hover:bg-cream hover:text-ink sm:right-4 sm:top-4"
          aria-label="Закрити"
        >
          <X className="h-5 w-5" strokeWidth={1.5} aria-hidden />
        </button>

        {orderId !== null ? (
          <div className="py-2 text-center" role="status">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4efeb] text-ink">
              <Check className="h-6 w-6" strokeWidth={1.75} aria-hidden />
            </span>
            <h2 id="quick-order-title" className="mt-4 font-serif text-2xl text-ink-text">
              Дякуємо!
            </h2>
            <p className="mt-2 text-lg font-medium text-ink">Замовлення №{orderId} прийнято</p>
            <p className="mx-auto mt-2 max-w-[340px] text-balance text-[15px] leading-6 text-brown">
              Менеджер зателефонує найближчим часом, щоб уточнити доставку й оплату.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-card bg-ink text-[15px] text-white transition-colors hover:bg-ink/90"
            >
              Продовжити покупки
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 id="quick-order-title" className="pr-10 font-serif text-2xl text-ink-text">
              Швидке замовлення
            </h2>
            <p className="mt-1 text-sm leading-6 text-brown">Менеджер зателефонує, щоб уточнити доставку й оплату.</p>

            {/* What is being ordered: the same line as in the cart */}
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#f4efeb] p-3">
              <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-xl bg-placeholder/40">
                {item.image && <Image src={item.image} alt={item.title} fill quality={90} sizes="56px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="leading-5 text-ink">{title}</p>
                <p className="mt-0.5 text-brown">{variant}</p>
              </div>
              <p className="shrink-0 pr-1 text-sm font-medium tabular-nums text-ink">{formatPrice(item.price * item.quantity)}</p>
            </div>

            <div className="mt-5 grid gap-4">
              <FormField label="Імʼя" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              <FormField
                label="Телефон"
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                inputRef={phone.ref}
                value={phoneValue}
                onChange={phone.onChange}
                onBlur={() => {
                  if (uaPhoneDigits(phoneValue) > 0 && !normalizeUaPhone(phoneValue)) setPhoneError(PHONE_ERROR)
                }}
                placeholder="+380 (__) ___ __ __"
                error={phoneError}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading || undefined}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-card bg-ink text-[15px] text-white transition-colors enabled:hover:bg-ink/90 disabled:cursor-wait"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Оформлюємо…
                </>
              ) : error ? (
                'Спробувати ще раз'
              ) : (
                'Замовити'
              )}
            </button>
            {error && (
              <div role="alert" className="mt-3 text-sm leading-6">
                <p className="text-destructive">{error}</p>
                <p className="mt-1 text-brown">
                  Якщо не виходить, зателефонуйте нам:{' '}
                  <a
                    href={`tel:${phoneHref(CONTACTS.phone)}`}
                    className="whitespace-nowrap text-ink underline underline-offset-4 hover:no-underline"
                  >
                    {CONTACTS.phone}
                  </a>
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
