import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Link to the "order accepted" page: /order/<token>. The page shows the customer's phone and address, so
 * the order number alone must not open it (/order/1042, /order/1043… would list strangers' orders).
 * The token is the number, an expiry and an HMAC of both with the server secret (PAYLOAD_SECRET):
 * it cannot be made up or changed without the secret, and no database field is needed.
 * Issued by api/order, read by app/(frontend)/order/[token].
 */
const TTL_DAYS = 30

function sign(id: number, exp: number): string {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is not set')
  return createHmac('sha256', secret).update(`order:${id}:${exp}`).digest('base64url').slice(0, 32)
}

export function orderToken(id: number, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + TTL_DAYS * 24 * 60 * 60
  return `${id}-${exp.toString(36)}-${sign(id, exp)}`
}

/** The order id when the token is genuine and not expired, otherwise null. */
export function readOrderToken(token: string, now = Date.now()): number | null {
  const match = /^(\d{1,10})-([0-9a-z]{1,10})-([\w-]{32})$/.exec(token)
  if (!match) return null
  const id = Number(match[1])
  const exp = parseInt(match[2], 36)
  if (!Number.isSafeInteger(id) || exp * 1000 < now) return null
  const expected = Buffer.from(sign(id, exp))
  const given = Buffer.from(match[3])
  return expected.length === given.length && timingSafeEqual(expected, given) ? id : null
}
