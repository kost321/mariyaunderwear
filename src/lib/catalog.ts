import type { Material, Product } from '@/payload-types'
import { isProductInStock, isSizeAvailable } from '@/lib/stock'
import { compareColors } from '@/lib/colors'

/**
 * Catalog filters. There are not many products, so we filter in memory after
 * fetching from Payload, which makes it simpler to compute facets (which sizes/colors exist).
 */

export type CatalogSort = 'new' | 'price-asc' | 'price-desc'

export type CatalogParams = {
  category?: string
  q?: string
  sizes: string[]
  colors: string[]
  /** Material slugs. */
  materials: string[]
  /** Only products that can be ordered now ("Тільки в наявності"). */
  inStockOnly: boolean
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
    materials: list(raw.material),
    inStockOnly: first(raw.stock) === 'in',
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

/** Whether the product can be ordered (lib/stock); if `sizes` are given, in at least one of them. */
function inStock(p: Product, sizes: string[] = []): boolean {
  if (!sizes.length) return isProductInStock(p.sizes)
  return (p.sizes ?? []).some((s) => isSizeAvailable(s) && sizeTokens(s.value).some((t) => sizes.includes(t)))
}

/**
 * A color card of a model (colorName set) has exactly one color; its legacy colors[]
 * may still list every color of the model (Tilda import), so it is ignored then.
 */
function productColorList(p: Product): { name: string; hex: string | null }[] {
  const colorName = p.colorName?.trim()
  if (colorName) return [{ name: colorName, hex: p.colorHex ?? null }]
  return (p.colors ?? [])
    .map((c) => ({ name: c.name.trim(), hex: c.hex ?? null }))
    .filter((c) => c.name)
}

function productColors(p: Product): string[] {
  return productColorList(p).map((c) => c.name)
}

/** Populated materials of a product (depth ≥ 1); bare ids are skipped. */
export function productMaterials(p: Pick<Product, 'materials'>): Material[] {
  return (p.materials ?? []).filter((m): m is Material => typeof m === 'object' && m !== null)
}

export function filterProducts(products: Product[], params: CatalogParams): Product[] {
  const result = products.filter((p) => {
    if (params.sizes.length && !productSizes(p).some((s) => params.sizes.includes(s))) return false
    if (params.colors.length && !productColors(p).some((c) => params.colors.includes(c))) return false
    if (params.materials.length && !productMaterials(p).some((m) => m.slug && params.materials.includes(m.slug)))
      return false
    // With sizes selected, "in stock" means one of the selected sizes is available, not any size
    if (params.inStockOnly && !inStock(p, params.sizes)) return false
    if (params.min && p.price < params.min) return false
    if (params.max && p.price > params.max) return false
    return true
  })

  if (params.sort === 'price-asc') result.sort((a, b) => a.price - b.price)
  if (params.sort === 'price-desc') result.sort((a, b) => b.price - a.price)
  // 'new': order from getProducts (-createdAt)
  return availableFirst(result)
}

/**
 * Products that can be ordered go first, sold-out ones after them, so a shopper does not open
 * a card only to find every size crossed out. The sort is stable: the chosen order holds inside each group.
 */
export function availableFirst(products: Product[]): Product[] {
  return [...products].sort((a, b) => Number(inStock(b)) - Number(inStock(a)))
}

export type CatalogFacets = {
  sizes: string[]
  colors: { name: string; hex: string | null }[]
  materials: { slug: string; title: string }[]
  /** How many products can be ordered now. */
  inStock: number
  priceMin: number
  priceMax: number
}

/** Which filter values exist among the products at all. */
export function getFacets(products: Product[]): CatalogFacets {
  const sizes = new Set<string>()
  const colors = new Map<string, string | null>()
  const materials = new Map<string, Material>()

  for (const p of products) {
    productSizes(p).forEach((s) => sizes.add(s))
    for (const c of productColorList(p)) if (!colors.get(c.name)) colors.set(c.name, c.hex)
    for (const m of productMaterials(p)) if (m.slug) materials.set(m.slug, m)
  }

  const rank = (s: string) => {
    const i = SIZE_ORDER.indexOf(s)
    return i === -1 ? SIZE_ORDER.length : i
  }
  const prices = products.map((p) => p.price)
  const inStockCount = products.filter((p) => inStock(p)).length

  return {
    sizes: [...sizes].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)),
    colors: [...colors].map(([name, hex]) => ({ name, hex })).sort((a, b) => compareColors(a.name, b.name)),
    materials: [...materials.values()]
      .sort(
        (a, b) =>
          (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity) || a.title.localeCompare(b.title, 'uk'),
      )
      .map((m) => ({ slug: m.slug!, title: m.title })),
    inStock: inStockCount,
    priceMin: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...prices) : 0,
  }
}
