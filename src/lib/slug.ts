import type { FieldHook } from 'payload'

/**
 * Cyrillic transliteration + normalization to a URL-safe form.
 * "Зимняя куртка" -> "zimnyaya-kurtka"
 */
const translitMap: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
  я: 'ya',
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((char) => translitMap[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-') // .replace(/[^a-z0-9]+/g, '-') // everything except [a-z0-9] -> hyphen
    .replace(/^-+|-+$/g, '') // .replace(/^-+|-+$/g, '') // strip hyphens at the edges
}

/**
 * FieldHook for the slug field: if it is empty, generate it from the source
 * field (title by default). If set manually, normalize it.
 */
export const formatSlug =
  (fallbackField = 'title'): FieldHook =>
  ({ value, data }) => {
    if (typeof value === 'string' && value.length > 0) {
      return slugify(value)
    }
    const fallback = data?.[fallbackField]
    if (typeof fallback === 'string' && fallback.length > 0) {
      return slugify(fallback)
    }
    return value
  }
