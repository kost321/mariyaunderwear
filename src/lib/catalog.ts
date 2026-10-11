import type { Product } from '@/payload-types'

/**
 * Catalog filters. There are not many products, so we filter in memory after
 * fetching from Payload, which makes it simpler to compute facets (which sizes/colors exist).
 */

export type CatalogSort = 'new' | 'price-asc' | 'price-desc'
export type CatalogStock = 'in' | 'out'

export type CatalogParams = {
  category?: string
  q?: string
  sizes: string[]
  colors: string[]
  stock?: CatalogStock
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
  const stock = first(raw.stock)
  return {
    category: first(raw.category) || undefined,
    q: first(raw.q)?.trim() || undefined,
    sizes: list(raw.size),
    colors: list(raw.color),
    stock: stock === 'in' || stock === 'out' ? stock : undefined,
    min: num(raw.min),
    max: num(raw.max),
    sort: sort === 'price-asc' || sort === 'price-desc' ? sort : 'new',
  }
}

// Order of sizes in the filter; the rest (e.g. 75B) come after, alphabetically
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']

/** "M/L" → ["M", "L"]; Cyrillic "М" → Latin. */
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

// Same rule as the product page: stock === 0 means sold out, an empty value means unknown (orderable).
const sizeAvailable = (s: { stock?: number | null }) => s.stock !== 0

/**
 * Whether the product can be ordered; if `sizes` are given, in at least one of them.
 * A product without sizes is orderable (the product page lets you add it to the cart).
 */
function inStock(p: Product, sizes: string[] = []): boolean {
  const entries = p.sizes ?? []
  if (!entries.length) return !sizes.length
  return entries.some(
    (s) => sizeAvailable(s) && (!sizes.length || sizeTokens(s.value).some((t) => sizes.includes(t))),
  )
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
    // With sizes selected, "in stock" means one of the selected sizes is available, not any size
    if (params.stock === 'in' && !inStock(p, params.sizes)) return false
    if (params.stock === 'out' && inStock(p)) return false
    if (params.min && p.price < params.min) return false
    if (params.max && p.price > params.max) return false
    return true
  })

  if (params.sort === 'price-asc') result.sort((a, b) => a.price - b.price)
  if (params.sort === 'price-desc') result.sort((a, b) => b.price - a.price)
  // 'new': order from getProducts (-createdAt)
  return result
}

export type CatalogFacets = {
  sizes: string[]
  colors: { name: string; hex: string | null }[]
  stock: { in: number; out: number }
  priceMin: number
  priceMax: number
}

/** Which filter values exist among the products at all. */
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
  const inStockCount = products.filter((p) => inStock(p)).length

  return {
    sizes: [...sizes].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)),
    colors: [...colors].map(([name, hex]) => ({ name, hex })).sort((a, b) => a.name.localeCompare(b.name, 'uk')),
    stock: { in: inStockCount, out: products.length - inStockCount },
    priceMin: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...prices) : 0,
  }
}
