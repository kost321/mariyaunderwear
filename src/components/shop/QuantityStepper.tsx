'use client'

import { cn } from '@/lib/utils'

/**
 * Quantity control in a horizontal capsule: − 1 +. Shared by the product page and the cart lines,
 * so both look the same. `max` caps the "+" (the stock of the chosen size, when known).
 */
export function QuantityStepper({
  value,
  onChange,
  max,
  label,
  className,
}: {
  value: number
  onChange: (next: number) => void
  max?: number
  /** What is counted, for screen readers: "Кількість, Нічна сорочка…" */
  label?: string
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={label ?? 'Кількість'}
      className={cn('flex items-center rounded-full border border-[#a3a3a3] px-1 text-sm text-ink', className)}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="flex h-8 w-8 items-center justify-center disabled:opacity-40"
        aria-label="Зменшити кількість"
      >
        −
      </button>
      <span className="min-w-6 text-center tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(max ? Math.min(max, value + 1) : value + 1)}
        disabled={max !== undefined && value >= max}
        className="flex h-8 w-8 items-center justify-center disabled:opacity-40"
        aria-label="Збільшити кількість"
      >
        +
      </button>
    </div>
  )
}
