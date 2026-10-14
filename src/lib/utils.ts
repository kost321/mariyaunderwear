import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * cn: the standard shadcn/ui utility.
 * Merges classes and correctly resolves Tailwind conflicts
 * (for example, "px-2" + "px-4" => "px-4").
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Price in hryvnias: "1 799 грн" / "1 799 UAH".
 * Formatted manually (thousands separated by a non-breaking space + currency suffix):
 * Intl.NumberFormat with style: 'currency' gives different results depending on the
 * ICU locale of the environment (Node vs browser) and breaks hydration.
 * `currency` is the currency label of the current language: t('Common.currency').
 */
export function formatPrice(value: number, currency: string): string {
  const digits = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')
  return `${digits}\u00a0${currency}`
}
