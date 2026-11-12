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
 * Price in hryvnias: "1 799 грн".
 * Formatted manually (thousands separated by a non-breaking space, suffix "грн"):
 * Intl.NumberFormat with style: 'currency' gives different results depending on the
 * ICU locale of the environment (Node vs browser) and breaks hydration.
 */
export function formatPrice(value: number): string {
  const digits = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${digits} грн`
}

/** Ukrainian plural form: plural(1, ['товар', 'товари', 'товарів']) → "товар", 3 → "товари", 5 → "товарів". */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

/**
 * Colour name as shown to shoppers, in sentence case: names come from the admin and the warehouse
 * import with mixed case ("Чайна Роза" next to "кавовий"). Display only: filters keep the stored name.
 */
export function colorLabel(name: string): string {
  const s = name.trim()
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

/** Light colours (milk, white, pale pink) vanish on a white page without a visible outline. */
export function isLightColor(hex: string | null | undefined): boolean {
  const m = hex?.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return false
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  // Perceived brightness (ITU-R BT.601)
  return 0.299 * r + 0.587 * g + 0.114 * b > 225
}

/**
 * Short product name for cards: "Нічна сорочка «Ранкова ніжність»" instead of
 * "Жіноча нічна сорочка «Ранкова ніжність», кавовий". The store sells women's wear only, so "Жіноча"
 * adds nothing, and the colour is named next to the price. The full title stays in <title>,
 * on the product page and in the photo's alt text.
 */
export function shortProductTitle(title: string): string {
  const quoteEnd = title.indexOf('»')
  const name = (quoteEnd === -1 ? title : title.slice(0, quoteEnd + 1))
    .replace(/^\s*жіноч\S*\s+/i, '')
    .trim()
  if (!name) return title
  // A short «model name» never breaks inside (no lone «Ранкова on one line and ніжність» on the next)
  const glued = name.replace(/«([^»]{1,22})»/, (m) => m.replace(/ /g, '\u00A0'))
  return glued.charAt(0).toUpperCase() + glued.slice(1)
}
