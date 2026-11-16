import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { createRateLimiter } from '@/lib/rateLimit'

// Called once per cart page view; generous, but not an open door to the whole catalogue
const isRateLimited = createRateLimiter(60, 60 * 1000)

/** productId → size → units in stock. A product that is missing (deleted, hidden) cannot be ordered. */
export type StockResponse = { stock: Record<string, Record<string, number>> }

/**
 * GET /api/stock?ids=1,2,3 — current stock of the sizes of the products in the cart.
 * The cart keeps a snapshot from the moment of adding, which goes stale (sold out, restocked, carts saved
 * before the snapshot existed); this refreshes it so "+" stops at what can really be ordered.
 * Same rule as lib/stock: an empty stock field counts as 0.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Забагато запитів' }, { status: 429 })
  }

  const ids = [
    ...new Set(
      (req.nextUrl.searchParams.get('ids') ?? '')
        .split(',')
        .filter(Boolean)
        .map(Number),
    ),
  ]
  if (ids.length === 0 || ids.length > 50 || ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    return NextResponse.json({ error: 'Невірні дані' }, { status: 400 })
  }

  const payload = await getPayload()
  const found = await payload.find({
    collection: 'products',
    where: { id: { in: ids }, active: { equals: true } },
    limit: ids.length,
    depth: 0,
    pagination: false,
    select: { sizes: true },
  })

  const stock: StockResponse['stock'] = {}
  for (const p of found.docs) {
    stock[String(p.id)] = Object.fromEntries(
      (p.sizes ?? []).map((s) => [s.value, typeof s.stock === 'number' && s.stock > 0 ? s.stock : 0]),
    )
  }
  return NextResponse.json<StockResponse>({ stock }, { headers: { 'Cache-Control': 'no-store' } })
}
