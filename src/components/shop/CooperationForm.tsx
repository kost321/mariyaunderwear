'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// Rounded like the catalog search field
const input =
  'h-11 w-full rounded-full border border-brown/30 bg-white px-5 text-sm text-ink placeholder:text-brown/50 focus:border-ink focus:outline-none'

const EMPTY = { firstName: '', lastName: '', email: '', company: '', phone: '', message: '' }
type Form = typeof EMPTY

type FieldProps = {
  name: keyof Form
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  className?: string
} & Pick<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'autoComplete' | 'maxLength' | 'placeholder' | 'inputMode'>

/** A label above the field (placeholders vanish as soon as you type), with an asterisk on required ones. */
function Field({ name, label, required, className, ...props }: FieldProps) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm text-brown">
        {label}
        {required && (
          <span className="text-ink" aria-hidden>
            {' '}
            *
          </span>
        )}
      </label>
      <input id={id} name={name} required={required} className={input} {...props} />
    </div>
  )
}

/** Contact form of the "Співпраця" page: sends the request to /api/cooperation. */
export function CooperationForm() {
  const [form, setForm] = useState(EMPTY)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
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
      <div className="flex flex-col justify-center gap-3 rounded-card bg-[#f4efeb] p-10 text-center">
        <p className="font-serif text-2xl text-ink-text">Дякуємо!</p>
        <p className="text-base leading-7 text-brown">Ми отримали вашу заявку і звʼяжемося з вами найближчим часом.</p>
      </div>
    )
  }

  const field = (name: keyof Form) => ({ name, value: form[name], onChange: handleChange })

  return (
    // One gap for rows and columns, so first and last name sit as far apart as the rows
    <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
      <Field {...field('firstName')} label="Імʼя" required autoComplete="given-name" maxLength={100} />
      <Field {...field('lastName')} label="Прізвище" autoComplete="family-name" maxLength={100} />
      <Field {...field('email')} label="Email" type="email" required autoComplete="email" maxLength={120} placeholder="name@example.com" className="sm:col-span-2" />
      <Field {...field('company')} label="Організація / компанія / магазин" autoComplete="organization" maxLength={200} className="sm:col-span-2" />
      <Field {...field('phone')} label="Телефон" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} placeholder="+380" className="sm:col-span-2" />

      {/* The point of the form: what the partner offers or asks about */}
      <div className="sm:col-span-2">
        <label htmlFor="cooperation-message" className="mb-1.5 block text-sm text-brown">
          Що вас цікавить?
        </label>
        {/*
          The rounded border is on a wrapper with a small inset: the browser draws the resize grip in the
          textarea's own corner, which on a rounded textarea poked out over the curve. Here it sits inside it.
        */}
        <div className="rounded-[20px] border border-brown/30 bg-white p-1.5 focus-within:border-ink">
          <textarea
            id="cooperation-message"
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={5}
            maxLength={2000}
            placeholder="Наприклад: оптове замовлення для магазину, колаборація, участь у виставці"
            className="block w-full resize-y bg-transparent px-3.5 py-1.5 text-sm leading-6 text-ink placeholder:text-brown/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="sm:col-span-2">
        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
        {/* Dark main button like "До каталогу": the pale one looked disabled */}
        <button
          type="submit"
          disabled={status === 'sending'}
          className="flex h-11 w-full items-center justify-between rounded-card bg-ink pl-7 pr-5 text-base text-white transition-colors hover:bg-ink/90 disabled:opacity-60 sm:w-[265px]"
        >
          {status === 'sending' ? 'Надсилаємо…' : 'Надіслати форму'}
          {/* The arrow file is brown; brightness-0 + invert turns it white on the dark button */}
          <Image src="/brand/arrow-long.svg" alt="" width={49} height={14} className="-scale-x-100 brightness-0 invert" />
        </button>
        <p className="mt-3 text-xs leading-5 text-brown">
          <span aria-hidden>* </span>обовʼязкові поля. Надсилаючи форму, ви погоджуєтесь із{' '}
          <Link href="/privacy" className="text-ink underline underline-offset-2 hover:no-underline">
            політикою конфіденційності
          </Link>
          .
        </p>
      </div>
    </form>
  )
}
