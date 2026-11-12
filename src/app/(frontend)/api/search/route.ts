import { NextRequest, NextResponse } from 'next/server'
import type { Product } from '@/payload-types'
import { getProducts } from '@/lib/queries'
import { availableFirst } from '@/lib/catalog'
import { getMediaUrl } from '@/lib/media'
import { isProductInStock } from '@/lib/stock'
import { colorLabel, shortProductTitle } from '@/lib/utils'
import { createRateLimiter } from '@/lib/rateLimit'

// Live search fires as the shopper types (debounced), so the limit is generous
const isRateLimited = createRateLimiter(120, 60 * 1000)

const RESULTS = 6
const SUGGESTIONS = 3

export type SearchItem = {
  href: string
  title: string
  price: number
  color: string | null
  hex: string | null
  image: string | null
  inStock: boolean
}

export type SearchResponse = {
  /** First matches, orderable ones first. */
  results: SearchItem[]
  /** All matches, for "Усі результати (N)". */
  total: number
  /** When nothing matched: a few products in stock instead of an empty panel. */
  suggestions: SearchItem[]
}

function toItem(p: Product): SearchItem {
  const color = p.colorName ?? p.colors?.[0]?.name ?? null
  return {
    href: `/product/${p.slug}`,
    title: shortProductTitle(p.title),
    price: p.price,
    color: color ? colorLabel(color).toLowerCase() : null,
    hex: (p.colorName ? p.colorHex : p.colors?.[0]?.hex) ?? null,
    image: getMediaUrl(p.images?.[0]?.image) ?? null,
    inStock: isProductInStock(p.sizes),
  }
}

/**
 * GET /api/search?q=… — live results for the header search panel.
 * Same matching as the catalog (/catalog?q=…), so "Усі результати" shows the same products.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Забагато запитів' }, { status: 429 })
  }

  const q = req.nextUrl.searchParams.get('q')?.trim().slice(0, 100) ?? ''
  if (q.length < 2) {
    return NextResponse.json<SearchResponse>({ results: [], total: 0, suggestions: [] })
  }

  const found = availableFirst(await getProducts({ q, limit: 200 }))
  const suggestions = found.length
    ? []
    : (await getProducts({ limit: 30 })).filter((p) => isProductInStock(p.sizes)).slice(0, SUGGESTIONS)

  return NextResponse.json<SearchResponse>({
    results: found.slice(0, RESULTS).map(toItem),
    total: found.length,
    suggestions: suggestions.map(toItem),
  })
}
