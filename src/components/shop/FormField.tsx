'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

/** Rounded text field, like the catalog search: shared by "Співпраця" and the checkout. */
export const inputClass =
  'h-11 w-full rounded-full border border-brown/30 bg-white px-5 text-sm text-ink placeholder:text-brown/50 focus:border-ink focus:outline-none'

type Props = {
  label: string
  required?: boolean
  /** Small line under the field ("Як у паспорті…") */
  hint?: React.ReactNode
  /** Replaces the hint and turns the border brick red */
  error?: string
  className?: string
  inputRef?: React.Ref<HTMLInputElement>
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'>

/** A label above the field (placeholders vanish as soon as you type), with an asterisk on required ones. */
export function FormField({ label, required, hint, error, className, inputRef, ...props }: Props) {
  const id = useId()
  const noteId = `${id}-note`
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
      <input
        id={id}
        ref={inputRef}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? noteId : undefined}
        className={cn(inputClass, error && 'border-destructive focus:border-destructive')}
        {...props}
      />
      {error ? (
        <p id={noteId} role="alert" className="mt-1.5 px-5 text-xs leading-5 text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={noteId} className="mt-1.5 px-5 text-xs leading-5 text-brown">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
