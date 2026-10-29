import { createHmac, timingSafeEqual } from 'node:crypto'

export const signQuote = (quote: Record<string, unknown>) => {
  const secret = useRuntimeConfig().quoteSigningSecret
  if (!secret) throw createError({ statusCode: 503, statusMessage: 'Quote signing belum dikonfigurasi' })
  const payload = Buffer.from(JSON.stringify({ ...quote, expiresAt: Date.now() + 15 * 60 * 1000 })).toString('base64url')
  const signature = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export const verifyQuote = (token: string) => {
  const secret = useRuntimeConfig().quoteSigningSecret
  const [payload, signature] = token.split('.')
  if (!secret || !payload || !signature) throw createError({ statusCode: 400, statusMessage: 'Quote pengiriman tidak valid' })
  const expected = createHmac('sha256', secret).update(payload).digest()
  const actual = Buffer.from(signature, 'base64url')
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw createError({ statusCode: 400, statusMessage: 'Quote pengiriman tidak valid' })
  const quote = JSON.parse(Buffer.from(payload, 'base64url').toString())
  if (!quote.expiresAt || quote.expiresAt < Date.now()) throw createError({ statusCode: 409, statusMessage: 'Quote pengiriman kedaluwarsa' })
  return quote as { id: string; courier: string; service: string; etd?: string; price: number; destinationId: string; expiresAt: number }
}
