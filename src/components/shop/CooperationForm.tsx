'use client'

import { useState } from 'react'
import Image from 'next/image'

const field =
  'h-11 w-full border border-[#d9d9d9] px-6 text-xs text-ink placeholder:text-brown focus:border-ink focus:outline-none'

const EMPTY = { firstName: '', lastName: '', email: '', company: '', position: '', phone: '' }

/** Contact form of the "Співпраця" page: sends the request to /api/cooperation. */
export function CooperationForm() {
  const [form, setForm] = useState(EMPTY)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/cooperation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(res.status === 400 || res.status === 429 ? data?.error : '')
      }
      setForm(EMPTY)
      setStatus('sent')
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Не вдалося надіслати форму. Спробуйте ще раз або напишіть нам на пошту.",
      )
      setStatus('idle')
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex flex-col justify-center gap-3 border border-[#d9d9d9] p-10 text-center">
        <p className="font-serif text-base uppercase text-ink">Дякуємо!</p>
        <p className="text-xs text-brown/70">Ми отримали вашу заявку і звʼяжемося з вами найближчим часом.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[15px]">
      <div className="grid grid-cols-2 gap-1.5">
        <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Імʼя" autoComplete="given-name" required maxLength={100} aria-label="Імʼя" className={field} />
        <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Прізвище" autoComplete="family-name" maxLength={100} aria-label="Прізвище" className={field} />
      </div>
      <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Ваш email" autoComplete="email" required maxLength={120} aria-label="Email" className={field} />
      <input name="company" value={form.company} onChange={handleChange} placeholder="Організація / компанія / магазин" autoComplete="organization" maxLength={200} aria-label="Організація" className={field} />
      <input name="position" value={form.position} onChange={handleChange} placeholder="Ваша посада" autoComplete="organization-title" maxLength={100} aria-label="Посада" className={field} />
      <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="Номер телефону" autoComplete="tel" maxLength={30} aria-label="Номер телефону" className={field} />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="flex h-11 w-full items-center justify-between rounded-card bg-cream px-[21px] font-serif text-sm text-ink transition-opacity hover:opacity-80 disabled:opacity-60 sm:w-[231px]"
        >
          {status === 'sending' ? 'Надсилаємо…' : 'Надіслати форму'}
          <Image src="/brand/arrow-long.svg" alt="" width={47} height={12} className="-scale-x-100" />
        </button>
      </div>
    </form>
  )
}
