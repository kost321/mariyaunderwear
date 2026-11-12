import type { CartItem, CheckoutForm } from '@/types/shop'

/**
 * Sending an order to /api/order from the checkout and the quick order, with the same safety net:
 *  - a time limit (the server answers only after the emails and SMS are sent);
 *  - the same `orderKey` on every retry, so an order whose answer was lost is returned, not repeated
 *    (api/order, lib/idempotency);
 *  - errors as text for the customer: no connection, a server failure, or the server's own message
 *    (out of stock, too many tries).
 */
const ORDER_TIMEOUT_MS = 30_000
export const NETWORK_ERROR = 'Не вдалося звʼязатися з сервером. Перевірте інтернет і спробуйте ще раз: введені дані збережено.'
export const SERVER_ERROR = 'Не вдалося оформити замовлення через збій на сервері. Спробуйте ще раз за хвилину: введені дані збережено.'

/** Key of one ordering attempt; randomUUID needs https (or localhost), the fallback covers the rest. */
export const newOrderKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`

export type PlacedOrder = { orderId: number; token?: string }

/** Resolves with the order; rejects with an Error whose message can be shown as is. */
export async function submitOrder(body: { items: CartItem[]; form: CheckoutForm; orderKey: string }): Promise<PlacedOrder> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ORDER_TIMEOUT_MS)
  try {
    let res: Response
    try {
      res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch {
      throw new Error(NETWORK_ERROR)
    }
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.orderId) {
      throw new Error((res.status === 400 || res.status === 429) && data?.error ? data.error : SERVER_ERROR)
    }
    return { orderId: data.orderId, token: data.token }
  } finally {
    clearTimeout(timer)
  }
}
