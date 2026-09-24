import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * cn — стандартная утилита shadcn/ui.
 * Объединяет классы и корректно разрешает конфликты Tailwind
 * (например, "px-2" + "px-4" => "px-4").
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Ціна у гривнях: "1 799 грн" / "1 799 UAH".
 * Форматуємо вручну (розряди через нерозривний пробіл + суфікс валюти) —
 * Intl.NumberFormat зі style: 'currency' дає різний результат залежно від
 * ICU-локалі середовища (Node vs браузер) і ламає гідратацію.
 * `currency` — підпис валюти поточної мови: t('Common.currency').
 */
export function formatPrice(value: number, currency: string): string {
  const digits = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')
  return `${digits}\u00a0${currency}`
}
