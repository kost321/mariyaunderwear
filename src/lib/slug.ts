import type { FieldHook } from 'payload'

/**
 * Транслитерация кириллицы + приведение к URL-безопасному виду.
 * "Зимняя куртка" -> "zimnyaya-kurtka"
 */
const translitMap: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
  я: 'ya',
  // українські літери
  і: 'i', ї: 'yi', є: 'ye', ґ: 'g',
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((char) => translitMap[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-') // всё кроме [a-z0-9] -> дефис
    .replace(/^-+|-+$/g, '') // убрать дефисы по краям
}

/**
 * FieldHook для поля slug: если оно пустое, генерируем из исходного
 * поля (по умолчанию title). Если задано вручную — нормализуем.
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
