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
 * Ціна у гривнях: "1 799 грн".
 * Форматуємо вручну (розряди через нерозривний пробіл, суфікс «грн») —
 * Intl.NumberFormat зі style: 'currency' дає різний результат залежно від
 * ICU-локалі середовища (Node vs браузер) і ламає гідратацію.
 */
export function formatPrice(value: number): string {
  const digits = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${digits} грн`
}
