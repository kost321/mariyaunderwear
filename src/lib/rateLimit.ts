/**
 * Limit on requests per IP address (kept in process memory, which is
 * enough for a single Railway instance). Each call creates its own counter.
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>()

  return function isRateLimited(ip: string): boolean {
    const now = Date.now()
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs)
    if (recent.length >= limit) {
      hits.set(ip, recent)
      return true
    }
    recent.push(now)
    hits.set(ip, recent)
    // Do not let the map grow without bound.
    if (hits.size > 5000) {
      for (const [key, times] of hits) {
        if (times.every((t) => now - t >= windowMs)) hits.delete(key)
      }
    }
    return false
  }
}
