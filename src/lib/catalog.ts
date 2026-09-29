import type { Product } from '@/payload-types'

/**
 * Фільтри каталогу. Товарів небагато, тож фільтруємо в пам'яті після
 * вибірки з Payload — так простіше рахувати фасети (які розміри/кольори є).
 */

export type CatalogSort = 'new' | 'price-asc' | 'price-desc'

export type CatalogParams = {
  category?: string
  q?: string
  sizes: string[]
  colors: string[]
  min?: number
  max?: number
  sort: CatalogSort
}

type RawParams = Record<string, string | string[] | undefined>

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const list = (v: string | string[] | undefined) =>
  (first(v) ?? '').split(',').map((s) => s.trim()).filter(Boolean)
const num = (v: string | string[] | undefined) => {
  const n = Number(first(v))
  return Number.isFinite(n) && n > 0 ? n : undefined
}

export function parseCatalogParams(raw: RawParams): CatalogParams {
  const sort = first(raw.sort)
  return {
    category: first(raw.category) || undefined,
    q: first(raw.q)?.trim() || undefined,
    sizes: list(raw.size),
    colors: list(raw.color),
    min: num(raw.min),
    max: num(raw.max),
    sort: sort === 'price-asc' || sort === 'price-desc' ? sort : 'new',
  }
}

// Порядок розмірів у фільтрі; решта (напр. 75B) — після, за алфавітом
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']

/** «M/L» → ["M", "L"]; кирилична «М» → латинська. */
function sizeTokens(value: string): string[] {
  return value
    .replace(/М/g, 'M')
    .split('/')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
}

function productSizes(p: Product): string[] {
  return (p.sizes ?? []).flatMap((s) => sizeTokens(s.value))
}

function productColors(p: Product): string[] {
  const names = (p.colors ?? []).map((c) => c.name)
  if (p.colorName) names.push(p.colorName)
  return names.map((n) => n.trim()).filter(Boolean)
}

export function filterProducts(products: Product[], params: CatalogParams): Product[] {
  const result = products.filter((p) => {
    if (params.sizes.length && !productSizes(p).some((s) => params.sizes.includes(s))) return false
    if (params.colors.length && !productColors(p).some((c) => params.colors.includes(c))) return false
    if (params.min && p.price < params.min) return false
    if (params.max && p.price > params.max) return false
    return true
  })

  if (params.sort === 'price-asc') result.sort((a, b) => a.price - b.price)
  if (params.sort === 'price-desc') result.sort((a, b) => b.price - a.price)
  // 'new' — порядок з getProducts (-createdAt)
  return result
}

export type CatalogFacets = {
  sizes: string[]
  colors: { name: string; hex: string | null }[]
  priceMin: number
  priceMax: number
}

/** Які значення фільтрів взагалі є серед товарів. */
export function getFacets(products: Product[]): CatalogFacets {
  const sizes = new Set<string>()
  const colors = new Map<string, string | null>()

  for (const p of products) {
    productSizes(p).forEach((s) => sizes.add(s))
    for (const c of p.colors ?? []) if (!colors.get(c.name)) colors.set(c.name.trim(), c.hex ?? null)
    if (p.colorName && !colors.get(p.colorName)) colors.set(p.colorName.trim(), p.colorHex ?? null)
  }

  const rank = (s: string) => {
    const i = SIZE_ORDER.indexOf(s)
    return i === -1 ? SIZE_ORDER.length : i
  }
  const prices = products.map((p) => p.price)

  return {
    sizes: [...sizes].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)),
    colors: [...colors].map(([name, hex]) => ({ name, hex })).sort((a, b) => a.name.localeCompare(b.name, 'uk')),
    priceMin: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...prices) : 0,
  }
}
