'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { CartItem } from '@/types/shop'

/**
 * "Quick order": a modal with a minimal form (name + phone).
 * Sends an order for this product straight through /api/order, bypassing
 * the cart and the checkout page. A manager calls back to confirm the details.
 *
 * `item` is built on the product page from the current selection (size, color,
 * quantity).
 */

// Service note for the manager in the order: always in Ukrainian,
// regardless of the site language.
const QUICK_ORDER_COMMENT = 'Швидке замовлення — уточнити деталі по телефону'
export function QuickOrderModal({
  open,
  onClose,
  item,
}: {
  open: boolean
  onClose: () => void
  item: CartItem
}) {
  const t = useTranslations('QuickOrder')
  const tc = useTranslations('Common')
  const locale = useLocale()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Esc + lock background scrolling while open.
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

  // Reset the state on every open.
  useEffect(() => {
    if (open) {
      setName('')
      setPhone('')
      setError('')
      setDone(false)
    }
  }, [open])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      setError(t('required'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [item],
          form: {
            customerName: name.trim(),
            phone: phone.trim(),
            city: '',
            novaPoshtaBranch: '',
            comment: QUICK_ORDER_COMMENT,
          },
          locale,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(res.status === 400 && data?.error ? data.error : '')
      }
      setDone(true)
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
    >
      <div
        className="relative w-full max-w-sm rounded-card bg-white p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-2xl leading-none text-muted-foreground hover:text-foreground"
          aria-label={tc('close')}
        >
          ×
        </button>

        {done ? (
          <div className="space-y-4 py-4 text-center">
            <h2 className="font-serif text-xl uppercase tracking-[1px] text-ink">{t('thanks')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('thanksText')}
            </p>
            <Button onClick={onClose} className="h-11 w-full rounded-card bg-ink">
              {tc('close')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="pr-8 font-serif text-lg uppercase tracking-[1px] text-ink">{t('title')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.title}
                {item.size ? `, ${t('size', { size: item.size })}` : ''}
                {item.color ? `, ${item.color}` : ''} — {t('pcs', { count: item.quantity })}
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="qo-name" className="text-sm font-medium">
                {t('name')}
              </label>
              <input
                id="qo-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="h-11 w-full border border-[#a3a3a3] px-4 text-sm text-ink placeholder:text-brown/50 focus:border-ink focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="qo-phone" className="text-sm font-medium">
                {t('phone')}
              </label>
              <input
                id="qo-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder={t('phonePlaceholder')}
                className="h-11 w-full border border-[#a3a3a3] px-4 text-sm text-ink placeholder:text-brown/50 focus:border-ink focus:outline-none"
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="h-11 w-full rounded-card bg-ink uppercase tracking-[1px]">
              {loading ? tc('sending') : t('submit')}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
