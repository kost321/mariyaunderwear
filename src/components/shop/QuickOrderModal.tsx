'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { CartItem } from '@/types/shop'

/**
 * «Швидке замовлення» — модалка з мінімальною формою (ім'я + телефон).
 * Відправляє замовлення на цей товар одразу через /api/order, минаючи
 * кошик і сторінку checkout. Менеджер передзвонює для уточнення деталей.
 *
 * `item` формується на сторінці товару з поточного вибору (розмір, колір,
 * кількість).
 */
export function QuickOrderModal({
  open,
  onClose,
  item,
}: {
  open: boolean
  onClose: () => void
  item: CartItem
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Esc + блокування прокрутки фону, поки відкрито.
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

  // Скидаємо стан при кожному відкритті.
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
      setError("Вкажіть ім'я та телефон.")
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
            comment: 'Швидке замовлення — уточнити деталі по телефону',
          },
        }),
      })
      if (!res.ok) throw new Error('bad response')
      setDone(true)
    } catch {
      setError("Щось пішло не так. Спробуйте ще раз або зателефонуйте нам.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Швидке замовлення"
    >
      <div
        className="relative w-full max-w-sm rounded-lg bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-2xl leading-none text-muted-foreground hover:text-foreground"
          aria-label="Закрити"
        >
          ×
        </button>

        {done ? (
          <div className="space-y-4 py-4 text-center">
            <h2 className="text-xl font-semibold">Дякуємо!</h2>
            <p className="text-sm text-muted-foreground">
              Ми зв'яжемось з вами найближчим часом, щоб підтвердити замовлення.
            </p>
            <Button onClick={onClose} className="w-full">
              Закрити
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="pr-8 text-lg font-semibold">Швидке замовлення</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.title}
                {item.size ? `, розмір ${item.size}` : ''}
                {item.color ? `, ${item.color}` : ''} — {item.quantity} шт.
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="qo-name" className="text-sm font-medium">
                Ім'я
              </label>
              <input
                id="qo-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full rounded-md border px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="qo-phone" className="text-sm font-medium">
                Телефон
              </label>
              <input
                id="qo-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+380"
                className="w-full rounded-md border px-3 py-2 text-sm"
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Відправляємо…' : 'Замовити'}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Потрібна доставка Новою Поштою?{' '}
              <Link href="/cart" className="underline" onClick={onClose}>
                Оформити через кошик
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
