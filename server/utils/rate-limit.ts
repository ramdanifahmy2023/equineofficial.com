type Bucket = { count: number; resetAt: number }

export const createRateLimiter = (limit: number, windowMs: number) => {
  const buckets = new Map<string, Bucket>()
  return (key: string, now = Date.now()) => {
    const bucket = buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      return { allowed: true, remaining: limit - 1, retryAfter: 0 }
    }
    bucket.count += 1
    const allowed = bucket.count <= limit
    return { allowed, remaining: Math.max(0, limit - bucket.count), retryAfter: allowed ? 0 : Math.ceil((bucket.resetAt - now) / 1000) }
  }
}

export const authRateLimiter = createRateLimiter(10, 15 * 60 * 1000)

export const getAuthRateLimitKey = (event: any, scope: string) => `${scope}:${getRequestIP(event, { xForwardedFor: true }) || 'unknown'}`

export const enforceAuthRateLimit = (event: any, scope: string) => {
  const result = authRateLimiter(getAuthRateLimitKey(event, scope))
  if (!result.allowed) throw createError({ statusCode: 429, statusMessage: 'Terlalu banyak percobaan login', data: { retryAfter: result.retryAfter } })
  return result
}
