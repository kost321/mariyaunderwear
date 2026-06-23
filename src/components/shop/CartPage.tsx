'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, X } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import type { CheckoutForm } from '@/types/shop'

type Step = 'cart' | 'success'

export function CartPage() {
  const { items, totalPrice, removeItem, updateQuantity, clear } = useCart()
  const [step, setStep] = useState<Step>('cart')
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
        body: JSON.stringify({ items, form }),
      })
      if (!res.ok) throw new Error('Помилка сервера')
      clear()
      setStep('success')
    } catch {
      setError("Щось пішло не так. Спробуйте ще раз або зв'яжіться з нами.")
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center gap-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Дякуємо за замовлення!</h1>
        <p className="text-muted-foreground">Ми зв'яжемось з вами найближчим часом.</p>
        <Link href="/catalog">
          <Button>Повернутись до каталогу</Button>
        </Link>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Кошик порожній</h1>
        <Link href="/catalog">
          <Button>Перейти до каталогу</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Ваш замовлення:</h1>

      {/* Список товарів */}
      <div className="divide-y">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-4 py-4">
            {item.image && (
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image src={item.image} alt={item.title} fill className="object-cover" sizes="64px" />
              </div>
            )}
            <div className="flex-1 space-y-1">
              <p className="font-semibold leading-tight">{item.title}</p>
              {item.color && <p className="text-sm text-muted-foreground">Колір: {item.color}</p>}
              {item.size && <p className="text-sm text-muted-foreground">Розмір: {item.size}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(i, item.quantity - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-6 text-center text-sm">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(i, item.quantity + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <p className="w-24 text-right font-medium">{formatPrice(item.price * item.quantity)}</p>
            <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <p className="text-right font-semibold">Сума: {formatPrice(totalPrice)}</p>

      {/* Форма */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm">Ваше ім'я та прізвище</label>
          <input
            name="customerName"
            value={form.customerName}
            onChange={handleChange}
            placeholder="Марія Іванівна"
            required
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Номер телефону</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+380 (00) 000-00-00"
            required
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Місто</label>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="Київ"
            required
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">№ відділення нової пошти</label>
          <input
            name="novaPoshtaBranch"
            value={form.novaPoshtaBranch}
            onChange={handleChange}
            placeholder="№ 1"
            required
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="pt-2 text-right">
          <p className="mb-4 font-semibold">Підсумкова сума: {formatPrice(totalPrice)}</p>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Відправляємо...' : 'Підтвердити замовлення'}
          </Button>
        </div>
      </form>
    </div>
  )
}
