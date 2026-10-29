export default defineEventHandler((event) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.method)) return
  const origin = getHeader(event, 'origin')
  if (!origin) return
  const host = getHeader(event, 'x-forwarded-host') || getHeader(event, 'host')
  const protocol = getHeader(event, 'x-forwarded-proto') || (import.meta.dev ? 'http' : 'https')
  if (!host || origin !== `${protocol}://${host}`) throw createError({ statusCode: 403, statusMessage: 'Cross-origin request ditolak' })
})
