/**
 * Repeat-safe requests: a client sends the same key with every retry of one action (an order), and the
 * server runs the action once. A retry that arrives while the first request is still running waits for it;
 * a retry after it succeeded gets the same answer. Failed answers are not kept, so a retry after an error
 * (out of stock, a server failure) runs again.
 *
 * Kept in process memory like the rate limiter (lib/rateLimit): enough for a single Railway instance; a
 * restart forgets the keys, which only reopens the small window it protects.
 */
export type StoredResponse = { status: number; body: unknown }

export function createIdempotencyCache(ttlMs: number) {
  const entries = new Map<string, { at: number; result: Promise<StoredResponse> }>()

  function prune(now: number) {
    for (const [key, entry] of entries) if (now - entry.at > ttlMs) entries.delete(key)
  }

  return {
    /** The finished successful answer for this key, if there is one (lets a retry skip the rate limit). */
    async done(key: string | undefined): Promise<StoredResponse | null> {
      const entry = key && entries.get(key)
      if (!entry || Date.now() - entry.at > ttlMs) return null
      const res = await entry.result
      return res.status === 200 ? res : null
    },

    /** Runs `action` once per key; without a key it just runs. */
    async run(key: string | undefined, action: () => Promise<StoredResponse>): Promise<StoredResponse> {
      if (!key) return action()
      const now = Date.now()
      prune(now)
      const existing = entries.get(key)
      if (existing) {
        const res = await existing.result
        if (res.status === 200) return res
      }
      const result = action().catch((err) => {
        entries.delete(key)
        throw err
      })
      entries.set(key, { at: now, result })
      const res = await result
      if (res.status !== 200) entries.delete(key)
      return res
    },
  }
}

/** Keys are client-made UUIDs; anything else is ignored (the request is then not deduplicated). */
export const idempotencyKey = (value: unknown) =>
  typeof value === 'string' && /^[\w-]{8,64}$/.test(value) ? value : undefined
